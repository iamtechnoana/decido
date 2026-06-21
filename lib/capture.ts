import { after } from 'next/server'
import { prisma } from './prisma'
import { extractProduct, domainOf } from './extractor'
import { enrichProduct } from './enrich'
import { generateTldr } from './summary'
import { computeNeedSignal } from './needmap'
import { daysFromNow, DEFAULT_TTL_DAYS } from './constants'

export interface CaptureResult {
  id: string
  url: string
  title: string | null
  duplicate: boolean
}

/** Eklentiden gelen, canlı DOM'dan okunmuş veri (sunucu bloğunu atlar). */
export interface ClientExtracted {
  title?: string | null
  imageUrl?: string | null
  description?: string | null
  price?: number | null
  currency?: string | null
}

/**
 * Bir ürün linkini yakala — SIFIR KARAR:
 * dedup → kaydı HEMEN oluştur (inbox, TTL) → response → arka planda işle.
 * /api/capture ve /api/telegram bunu paylaşır.
 *
 * client verilmişse (eklenti canlı sayfadan okudu) sunucu çıkarımı atlanır —
 * bot-korumalı siteler (H&M vb.) böyle çalışır.
 */
export async function captureUrl(
  rawUrl: string,
  source: 'web' | 'extension' | 'telegram',
  client?: ClientExtracted,
): Promise<CaptureResult> {
  const url = normalizeUrl(rawUrl)

  const existing = await prisma.product.findUnique({ where: { url } })
  if (existing) {
    return { id: existing.id, url, title: existing.title, duplicate: true }
  }

  const hasClient = !!client?.title

  // Kullanıcı hiç beklemesin: kaydı HEMEN oluştur (eklenti verisi varsa dolu).
  const product = await prisma.product.create({
    data: {
      url,
      domain: domainOf(url),
      source,
      status: 'inbox',
      expiresAt: daysFromNow(DEFAULT_TTL_DAYS),
      ...(hasClient
        ? {
            title: client!.title ?? null,
            imageUrl: client!.imageUrl ?? null,
            description: client!.description ?? null,
            price: client!.price ?? null,
            currency: client!.currency ?? null,
            extractionTier: 'client',
          }
        : {}),
    },
  })

  // Çıkarım (gerekirse) + zenginleştirme + ihtiyaç eşleme arka planda.
  after(() => processCaptured(product.id, url, hasClient))

  return { id: product.id, url, title: hasClient ? (client!.title ?? null) : null, duplicate: false }
}

/**
 * Arka plan boru hattı: parse → enrich → tldr → need-mapping. Her adım izole (graceful).
 * skipExtract: eklenti canlı veriyi sağladı → sunucu fetch'ini atla (blok riski yok).
 */
async function processCaptured(id: string, url: string, skipExtract = false): Promise<void> {
  let pageText: string | undefined

  // 1) Çıkarım (eklenti verisi yoksa)
  if (!skipExtract) {
    try {
      const extracted = await extractProduct(url)
      pageText = extracted.pageText
      await prisma.product.update({
        where: { id },
        data: {
          title: extracted.title ?? null,
          imageUrl: extracted.imageUrl ?? null,
          description: extracted.description ?? null,
          price: extracted.price ?? null,
          currency: extracted.currency ?? null,
          extractionTier: extracted.tier,
          rawMeta: (extracted.raw ?? {}) as object,
        },
      })
    } catch (err) {
      console.error('[decido] çıkarım hatası', id, err)
    }
  }

  // 2) Zenginleştirme (kategori/spec/tag)
  try {
    const p = await prisma.product.findUnique({ where: { id } })
    if (p) {
      const e = await enrichProduct({
        title: p.title,
        description: p.description,
        price: p.price,
        domain: p.domain,
      })
      if (e) {
        await prisma.product.update({
          where: { id },
          data: { category: e.category, tags: e.tags, specs: e.specs, enrichedAt: new Date() },
        })
      }
    }
  } catch (err) {
    console.error('[decido] enrich hatası', id, err)
  }

  // 3) TL;DR özeti (güçlü model, sayfa metni + bilgi)
  try {
    const p = await prisma.product.findUnique({ where: { id } })
    if (p?.title) {
      const t = await generateTldr({
        title: p.title,
        description: p.description,
        category: p.category,
        price: p.price,
        domain: p.domain,
        pageText,
      })
      if (t) {
        await prisma.product.update({
          where: { id },
          data: { tldr: t as object, tldrAt: new Date() },
        })
      }
    }
  } catch (err) {
    console.error('[decido] tldr hatası', id, err)
  }

  // 4) İhtiyaç Eşleme (kategori bilindikten sonra)
  try {
    await computeNeedSignal(id)
  } catch (err) {
    console.error('[decido] need-signal hatası', id, err)
  }
}

/** URL'i normalize et: takip parametrelerini at, fragment'i kaldır → daha iyi dedup. */
export function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw.trim())
    u.hash = ''
    const strip = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'gclid', 'fbclid', 'ref', 'referrer', 'spm',
    ]
    strip.forEach((p) => u.searchParams.delete(p))
    return u.toString()
  } catch {
    return raw.trim()
  }
}

/** Bir metin içinden ilk http(s) linkini ayıkla (Telegram mesajları için). */
export function firstUrl(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s]+/)
  return m ? m[0] : null
}
