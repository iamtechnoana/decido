import { NextResponse } from 'next/server'
import { isLoggedIn } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { toProductDTO } from '@/lib/serialize'

export const runtime = 'nodejs'

/** Tüm ürünleri (opsiyonel duruma göre filtreli) döndür. */
export async function GET(req: Request) {
  if (!(await isLoggedIn())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const status = new URL(req.url).searchParams.get('status') ?? undefined
  const rows = await prisma.product.findMany({
    where: status ? { status } : undefined,
    orderBy: { capturedAt: 'desc' },
    include: { priceChecks: { orderBy: { checkedAt: 'asc' }, take: 100 } },
  })
  return NextResponse.json({ products: rows.map(toProductDTO) })
}
