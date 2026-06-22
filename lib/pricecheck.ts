import { prisma } from './prisma'
import { extractPriceOnly } from './extractor'
import { notifyOwner } from './telegram'

export interface PriceCheckSummary {
  checked: number
  priced: number
  alerts: number
  details: Array<{
    id: string
    title: string | null
    oldPrice: number | null
    newPrice: number | null
    reasons: string[]
  }>
}

/**
 * Alarmı açık adayların fiyatını Tier-1 ile yeniden çeker, geçmişe kaydeder ve
 * hedef fiyat / yeni en-düşük koşulunda bildirim gönderir (uygulama-içi sinyal her
 * zaman türetilir; Telegram kuruluysa push da gönderilir). Bkz. ADR 0008.
 */
export async function runPriceChecks(): Promise<PriceCheckSummary> {
  const products = await prisma.product.findMany({
    where: { alertEnabled: true, status: 'candidate' },
    include: { priceChecks: { orderBy: { checkedAt: 'desc' }, take: 100 } },
  })

  const summary: PriceCheckSummary = { checked: 0, priced: 0, alerts: 0, details: [] }

  for (const p of products) {
    summary.checked++
    const res = await extractPriceOnly(p.url)
    if (!res) {
      summary.details.push({ id: p.id, title: p.title, oldPrice: p.price, newPrice: null, reasons: [] })
      continue
    }
    summary.priced++

    const prev = p.price
    const history = p.priceChecks.map((c) => c.price)
    const lowestBefore = history.length ? Math.min(...history) : prev

    await prisma.priceCheck.create({
      data: { productId: p.id, price: res.price, currency: res.currency ?? p.currency },
    })
    await prisma.product.update({
      where: { id: p.id },
      data: { price: res.price, currency: res.currency ?? p.currency },
    })

    const reasons: string[] = []
    // Hedefin altına YENİ inme (önce üstündeyken) — tek seferlik tetikler.
    if (p.targetPrice != null && res.price <= p.targetPrice && (prev == null || prev > p.targetPrice)) {
      reasons.push(`hedef ${p.targetPrice} altına indi`)
    }
    // Yeni en düşük fiyat — sadece gerçekten dip kırılınca.
    if (lowestBefore != null && res.price < lowestBefore) {
      reasons.push('yeni en düşük fiyat')
    }

    if (reasons.length) {
      summary.alerts++
      await prisma.product.update({ where: { id: p.id }, data: { lastAlertedAt: new Date() } })
      await notifyOwner(
        `🔔 ${p.title ?? p.url}\n${res.price} ${res.currency ?? ''} — ${reasons.join(', ')}\n${p.url}`,
      )
    }

    summary.details.push({ id: p.id, title: p.title, oldPrice: prev, newPrice: res.price, reasons })
  }

  return summary
}
