import * as cheerio from 'cheerio'
import { ENRICH_MODEL, jsonFromLLM } from './ai'

export interface ExtractedProduct {
  title?: string
  imageUrl?: string
  description?: string
  price?: number
  currency?: string
  tier: 'og' | 'render' | 'llm' | 'manual' | 'blocked'
  raw?: Record<string, unknown>
  pageText?: string // TL;DR için temizlenmiş sayfa metni (in-memory; DB'ye yazılmaz)
}

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// Gerçek Chrome navigasyonuna benzer header'lar — basit bot bloklarını aşmaya yardımcı.
const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent': UA,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
  'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
}

const MAX_LLM_CHARS = 12000

/** Bot-koruma / engelleme sayfası mı? (çöp başlık kaydetmemek için). */
function looksBlocked(title: string | undefined, pageTextLen: number): boolean {
  const t = (title ?? '').toLowerCase()
  if (/access denied|forbidden|403 |error 403|are you (a )?human|captcha|verify you are|bot detection|unusual traffic|robot check|just a moment|attention required|pardon our interruption/i.test(t)) {
    return true
  }
  // OG/JSON-LD yok + neredeyse boş gövde → JS-render SPA ya da blok kabuğu.
  return pageTextLen < 60
}

function parsePrice(value?: string | number | null): number | undefined {
  if (value == null) return undefined
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  // "1.299,00 TL" / "$1,299.00" / "1299" gibi biçimleri normalize et.
  const cleaned = value.replace(/[^\d.,]/g, '')
  if (!cleaned) return undefined
  let normalized = cleaned
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Son ayraç ondalık kabul edilir.
    normalized = cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')
      ? cleaned.replace(/\./g, '').replace(',', '.')
      : cleaned.replace(/,/g, '')
  } else if (cleaned.includes(',')) {
    normalized = cleaned.replace(',', '.')
  }
  const n = parseFloat(normalized)
  return Number.isFinite(n) ? n : undefined
}

const asStr = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined)

/** schema.org JSON-LD bloklarından ilk Product nesnesini bul. */
function fromJsonLd($: cheerio.CheerioAPI): Partial<ExtractedProduct> {
  const out: Partial<ExtractedProduct> = {}
  $('script[type="application/ld+json"]').each((_, el) => {
    if (out.title && out.price != null) return
    const txt = $(el).contents().text()
    if (!txt) return
    let data: unknown
    try {
      data = JSON.parse(txt)
    } catch {
      return
    }
    const nodes: unknown[] = Array.isArray(data)
      ? data
      : (data as { '@graph'?: unknown[] })?.['@graph'] ?? [data]
    for (const node of nodes) {
      const n = node as Record<string, unknown>
      const type = n['@type']
      const isProduct = type === 'Product' || (Array.isArray(type) && type.includes('Product'))
      if (!isProduct) continue
      out.title ??= asStr(n.name)
      out.description ??= asStr(n.description)
      const imgRaw = Array.isArray(n.image) ? n.image[0] : n.image
      out.imageUrl ??= asStr(imgRaw) ?? asStr((imgRaw as Record<string, unknown> | undefined)?.url)
      const offersRaw = Array.isArray(n.offers) ? n.offers[0] : n.offers
      const offers = offersRaw as Record<string, unknown> | undefined
      if (offers) {
        out.price ??= parsePrice((offers.price ?? offers.lowPrice) as string | number | null | undefined)
        out.currency ??= asStr(offers.priceCurrency)
      }
    }
  })
  return out
}

/** Open Graph + meta etiketlerinden çıkarım. */
function fromOpenGraph($: cheerio.CheerioAPI): Partial<ExtractedProduct> {
  const meta = (prop: string) =>
    $(`meta[property="${prop}"]`).attr('content') ||
    $(`meta[name="${prop}"]`).attr('content') ||
    undefined
  return {
    title: meta('og:title') || $('title').first().text().trim() || undefined,
    imageUrl: meta('og:image') || meta('og:image:url'),
    description: meta('og:description') || meta('description'),
    price: parsePrice(meta('product:price:amount') || meta('og:price:amount')),
    currency: meta('product:price:currency') || meta('og:price:currency'),
  }
}

function isComplete(p: Partial<ExtractedProduct>): boolean {
  return !!p.title && !!p.imageUrl && p.price != null
}

/** Tier 3 — temizlenmiş sayfa metnini LLM'e verip yapılandırılmış alan çıkar. */
async function llmFallback(pageText: string): Promise<Partial<ExtractedProduct>> {
  const text = pageText.slice(0, MAX_LLM_CHARS)
  const prompt = `Aşağıdaki bir ürün sayfasının metnidir. Sadece geçerli JSON döndür:
{
  "title": "ürün adı",
  "imageUrl": "ana görsel URL'i veya null",
  "description": "kısa açıklama",
  "price": sayısal fiyat veya null,
  "currency": "TRY|USD|EUR vb. veya null"
}

SAYFA METNİ:
---
${text}
---`
  const result = await jsonFromLLM<Partial<ExtractedProduct>>(ENRICH_MODEL, prompt, 1024)
  return {
    title: result?.title || undefined,
    imageUrl: result?.imageUrl || undefined,
    description: result?.description || undefined,
    price: parsePrice(result?.price),
    currency: result?.currency || undefined,
  }
}

/**
 * Katmanlı çıkarım: Tier1 (OG/schema) → eksikse Tier3 (LLM).
 * Tier2 (Playwright JS-render) MVP'de devre dışı; çoğu site verisi HTML'de
 * mevcut olduğundan Tier1+Tier3 yeterli kapsama sağlar (bkz. README riskler).
 */
export async function extractProduct(url: string): Promise<ExtractedProduct> {
  let html = ''
  try {
    const res = await fetch(url, { headers: BROWSER_HEADERS, redirect: 'follow' })
    html = await res.text()
  } catch {
    return { tier: 'manual' }
  }

  const $ = cheerio.load(html)
  const ld = fromJsonLd($)
  const og = fromOpenGraph($)

  // Sayfa metnini bir kez çıkar (JSON-LD zaten ayrıştırıldı; script'leri kaldır).
  // Hem Tier-3 fallback hem TL;DR (Faz 4) bunu kullanır → tek geçiş.
  $('script, style, noscript, svg').remove()
  const pageText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, MAX_LLM_CHARS)

  const merged: Partial<ExtractedProduct> = {
    title: ld.title || og.title,
    imageUrl: ld.imageUrl || og.imageUrl,
    description: ld.description || og.description,
    price: ld.price ?? og.price,
    currency: ld.currency || og.currency,
  }

  // Bot-koruma / boş kabuk → çöp ("Access Denied" vb.) kaydetme; LLM'e de gitme.
  if (looksBlocked(merged.title, pageText.length)) {
    return { tier: 'blocked', raw: { ld, og }, pageText }
  }

  if (isComplete(merged)) {
    return { ...merged, tier: 'og', raw: { ld, og }, pageText }
  }

  // Eksik alan(lar) var → LLM fallback ile tamamla.
  try {
    const llm = await llmFallback(pageText)
    if (looksBlocked(llm.title, pageText.length)) {
      return { tier: 'blocked', raw: { ld, og, llm }, pageText }
    }
    return {
      title: merged.title || llm.title,
      imageUrl: merged.imageUrl || llm.imageUrl,
      description: merged.description || llm.description,
      price: merged.price ?? llm.price,
      currency: merged.currency || llm.currency,
      tier: 'llm',
      raw: { ld, og, llm },
      pageText,
    }
  } catch {
    // LLM başarısızsa elde olanı döndür (graceful degradation).
    return { ...merged, tier: merged.title ? 'og' : 'manual', raw: { ld, og }, pageText }
  }
}

/**
 * Sadece fiyat çek (Tier-1: OG/schema.org). LLM YOK — periyodik fiyat kontrolü için ucuz.
 * JS ile yüklenen fiyatlı sitelerde null dönebilir (bilinçli; bkz. ADR 0008).
 */
export async function extractPriceOnly(
  url: string,
): Promise<{ price: number; currency?: string } | null> {
  let html = ''
  try {
    const res = await fetch(url, { headers: BROWSER_HEADERS, redirect: 'follow' })
    html = await res.text()
  } catch {
    return null
  }
  const $ = cheerio.load(html)
  const ld = fromJsonLd($)
  const og = fromOpenGraph($)
  const price = ld.price ?? og.price
  if (price == null) return null
  return { price, currency: ld.currency || og.currency || undefined }
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}
