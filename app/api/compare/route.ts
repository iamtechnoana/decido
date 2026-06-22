import { NextResponse } from 'next/server'
import { isLoggedIn } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { compareGroup } from '@/lib/compare'

export const runtime = 'nodejs'
export const maxDuration = 120

/**
 * Grup-içi karşılaştırma (on-demand, cache'li).
 * Gövde: { groupKey: "category:<ad>" | "bucket:<id>", force?: boolean }
 */
export async function POST(req: Request) {
  if (!(await isLoggedIn())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: { groupKey?: string; force?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const groupKey = body.groupKey ?? ''
  const [kind, ...rest] = groupKey.split(':')
  const value = rest.join(':')
  if ((kind !== 'category' && kind !== 'bucket') || !value) {
    return NextResponse.json({ error: 'geçersiz groupKey' }, { status: 400 })
  }

  const items = await prisma.product.findMany({
    where:
      kind === 'category'
        ? { category: value, status: { not: 'archived' } }
        : { bucketId: value, status: { not: 'archived' } },
    select: {
      id: true, title: true, price: true, currency: true,
      description: true, domain: true, tags: true, specs: true,
    },
  })

  if (items.length < 2) {
    return NextResponse.json({ error: 'karşılaştırma için en az 2 ürün gerekli' }, { status: 400 })
  }

  try {
    const result = await compareGroup(groupKey, items, { force: body.force })
    if (!result) return NextResponse.json({ error: 'karşılaştırma üretilemedi' }, { status: 502 })
    return NextResponse.json(result)
  } catch (err) {
    console.error('[decido] compare hatası', err)
    return NextResponse.json({ error: 'compare failed' }, { status: 500 })
  }
}
