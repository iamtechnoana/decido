import { prisma } from './prisma'

export interface TtlSweepSummary {
  archived: number
  ids: string[]
}

/**
 * TTL süpürme: süresi dolmuş ('inbox' + expiresAt < now) ürünleri otomatik arşivler
 * (yıkıcı değil — Eriyik'ten geri alınabilir). Zamanlayıcı kullanıcının yerine karar verir.
 */
export async function runTtlSweep(): Promise<TtlSweepSummary> {
  const now = new Date()
  const expired = await prisma.product.findMany({
    where: { status: 'inbox', expiresAt: { lt: now } },
    select: { id: true },
  })
  if (expired.length) {
    await prisma.product.updateMany({
      where: { id: { in: expired.map((e) => e.id) } },
      data: { status: 'archived', archiveReason: 'ttl', archivedAt: now },
    })
  }
  return { archived: expired.length, ids: expired.map((e) => e.id) }
}
