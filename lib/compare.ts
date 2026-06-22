import { COMPARE_MODEL, jsonFromLLM } from './ai'
import { prisma } from './prisma'

export interface CompareCandidate {
  id: string
  title?: string | null
  price?: number | null
  currency?: string | null
  description?: string | null
  domain?: string | null
  tags?: unknown
  specs?: unknown
}

export interface CompareResult {
  specKeys: string[]
  rows: Array<{
    id: string
    title: string
    score: number
    reason: string
    pros: string[]
    cons: string[]
    specs: Record<string, string>
  }>
  winnerId: string | null
  summary: string
}

/** Gruptaki ürünlerin kimlik+fiyatından deterministik imza (cache geçersizleştirme). */
function signatureOf(items: CompareCandidate[]): string {
  return items
    .map((i) => `${i.id}:${i.price ?? ''}`)
    .sort()
    .join('|')
}

function buildPrompt(items: CompareCandidate[]): string {
  const lines = items.map((i, idx) => {
    const specs = i.specs && typeof i.specs === 'object' ? JSON.stringify(i.specs) : '{}'
    return `#${idx + 1} [id:${i.id}]
  Başlık: ${i.title ?? '(yok)'}
  Fiyat: ${i.price ?? '(yok)'} ${i.currency ?? ''}
  Site: ${i.domain ?? ''}
  Özellikler: ${specs}
  Açıklama: ${(i.description ?? '').slice(0, 500)}`
  })

  return `Sen tarafsız bir satın-alma danışmanısın. Aşağıdaki aynı kategori adaylarını karşılaştır.
Spec verisi zayıfsa fiyat / kullanım amacı / genel değer üzerinden değerlendir; uydurma yapma.
Sadece geçerli JSON döndür:
{
  "specKeys": ["karşılaştırmada kullanılacak ortak özellik anahtarları"],
  "rows": [
    {
      "id": "ürün id'si (yukarıdaki id ile birebir)",
      "title": "kısa ad",
      "score": 0-100 arası tam sayı (değer/uygunluk),
      "reason": "tek cümle skor gerekçesi",
      "pros": ["1-3 artı"],
      "cons": ["1-3 eksi"],
      "specs": { "specKeys'teki her anahtar için değer veya '—' }
    }
  ],
  "winnerId": "şu an önde olan ürünün id'si",
  "summary": "2-3 cümle: hangi durumda hangisi, neden önde olan önde"
}

ADAYLAR:
${lines.join('\n\n')}`
}

/**
 * Grup-içi karşılaştırma (on-demand, cache'li). groupKey örn: "category:kablosuz kulaklık".
 * Skorları ilgili Product kayıtlarına geri yazar.
 */
export async function compareGroup(
  groupKey: string,
  items: CompareCandidate[],
  opts: { force?: boolean } = {},
): Promise<CompareResult | null> {
  if (items.length < 2) return null
  const signature = signatureOf(items)

  if (!opts.force) {
    const cached = await prisma.comparisonCache.findUnique({ where: { groupKey } })
    if (cached && cached.signature === signature) {
      return cached.result as unknown as CompareResult
    }
  }

  const result = await jsonFromLLM<CompareResult>(COMPARE_MODEL, buildPrompt(items), 3072)
  if (!result || !Array.isArray(result.rows)) return null

  // Cache'i upsert et.
  await prisma.comparisonCache.upsert({
    where: { groupKey },
    create: { groupKey, signature, result: result as unknown as object },
    update: { signature, result: result as unknown as object },
  })

  // Skorları ürünlere geri yaz (en iyi-çaba; hatayı yut).
  await Promise.all(
    result.rows.map((r) =>
      prisma.product
        .update({
          where: { id: r.id },
          data: { score: Math.round(r.score), scoreReason: r.reason },
        })
        .catch(() => undefined),
    ),
  )

  return result
}
