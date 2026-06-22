import { prisma } from './prisma'
import { DAY_MS } from './constants'

export interface NeedSignal {
  sameCategoryCount: number // aynı kategoride arşivlenmemiş diğer ürünler
  recentBuys: number // son 6 ayda aynı kategoride alınan
  recentSpend: number // bunların toplam fiyatı
  similar: { id: string; title: string } | null // çok benzeyen mevcut ürün
}

const SIX_MONTHS_MS = 182 * DAY_MS
const STOP = new Set([
  've', 'ile', 'için', 'bir', 'the', 'and', 'for', 'with', 'pro', 'max', 'plus', 'new',
])

function tokens(s: string | null | undefined): Set<string> {
  return new Set(
    (s ?? '')
      .toLowerCase()
      .split(/[^a-z0-9çğıöşü]+/i)
      .filter((t) => t.length >= 3 && !STOP.has(t)),
  )
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0
  let inter = 0
  for (const t of a) if (b.has(t)) inter++
  return inter / (a.size + b.size - inter)
}

/**
 * İhtiyaç Eşleme: kullanıcının KENDİ geçmişinden desen çıkarır (dürtü farkındalığı).
 * Embedding yok; basit sayım + başlık-token benzerliği. Bloke etmez, bilgilendirir.
 */
export async function computeNeedSignal(id: string): Promise<NeedSignal | null> {
  const p = await prisma.product.findUnique({ where: { id } })
  if (!p || !p.category) return null

  const others = await prisma.product.findMany({
    where: { category: p.category, id: { not: id }, status: { not: 'archived' } },
    select: { id: true, title: true, price: true, status: true, updatedAt: true },
  })

  const sixMonthsAgo = new Date(Date.now() - SIX_MONTHS_MS)
  const buys = others.filter((o) => o.status === 'bought' && o.updatedAt >= sixMonthsAgo)
  const recentSpend = buys.reduce((s, o) => s + (o.price ?? 0), 0)

  // En benzer mevcut ürün (başlık token Jaccard ≥ 0.4)
  const mine = tokens(p.title)
  let similar: { id: string; title: string } | null = null
  let best = 0.4
  for (const o of others) {
    const sim = jaccard(mine, tokens(o.title))
    if (sim > best) {
      best = sim
      similar = { id: o.id, title: o.title ?? '' }
    }
  }

  const signal: NeedSignal = {
    sameCategoryCount: others.length,
    recentBuys: buys.length,
    recentSpend,
    similar,
  }

  await prisma.product.update({ where: { id }, data: { needSignal: signal as object } })
  return signal
}
