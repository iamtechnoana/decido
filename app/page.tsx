import { redirect } from 'next/navigation'
import { isLoggedIn } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { toProductDTO } from '@/lib/serialize'
import Board from '@/components/Board'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  if (!(await isLoggedIn())) redirect('/login')

  const rows = await prisma.product.findMany({
    orderBy: { capturedAt: 'desc' },
    include: { priceChecks: { orderBy: { checkedAt: 'asc' }, take: 100 } },
  })

  const products = rows.map(toProductDTO)
  return <Board initialProducts={products} />
}
