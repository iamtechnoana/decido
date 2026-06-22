import type { ProductDTO, NeedSignalDTO, TldrDTO } from './types'

// Prisma Product satırının (priceChecks dahil) DTO'ya dönüşümü.
// page.tsx ve /api/products aynı şekli üretsin diye tek yerde.
interface ProductRow {
  id: string
  url: string
  domain: string
  source: string
  title: string | null
  imageUrl: string | null
  description: string | null
  price: number | null
  currency: string | null
  category: string | null
  tags: unknown
  specs: unknown
  score: number | null
  scoreReason: string | null
  status: string
  notes: string | null
  bucketId: string | null
  extractionTier: string | null
  targetPrice: number | null
  alertEnabled: boolean
  lastAlertedAt: Date | null
  expiresAt: Date | null
  archivedAt: Date | null
  archiveReason: string | null
  needSignal: unknown
  tldr: unknown
  capturedAt: Date
  enrichedAt: Date | null
  priceChecks?: Array<{ price: number; checkedAt: Date }>
}

export function toProductDTO(p: ProductRow): ProductDTO {
  return {
    id: p.id,
    url: p.url,
    domain: p.domain,
    source: p.source,
    title: p.title,
    imageUrl: p.imageUrl,
    description: p.description,
    price: p.price,
    currency: p.currency,
    category: p.category,
    tags: (p.tags as string[] | null) ?? null,
    specs: (p.specs as Record<string, string> | null) ?? null,
    score: p.score,
    scoreReason: p.scoreReason,
    status: p.status,
    notes: p.notes,
    bucketId: p.bucketId,
    extractionTier: p.extractionTier,
    targetPrice: p.targetPrice,
    alertEnabled: p.alertEnabled,
    lastAlertedAt: p.lastAlertedAt ? p.lastAlertedAt.toISOString() : null,
    priceHistory: (p.priceChecks ?? [])
      .slice()
      .sort((a, b) => a.checkedAt.getTime() - b.checkedAt.getTime())
      .map((c) => ({ price: c.price, at: c.checkedAt.toISOString() })),
    expiresAt: p.expiresAt ? p.expiresAt.toISOString() : null,
    archivedAt: p.archivedAt ? p.archivedAt.toISOString() : null,
    archiveReason: p.archiveReason,
    needSignal: (p.needSignal as NeedSignalDTO | null) ?? null,
    tldr: (p.tldr as TldrDTO | null) ?? null,
    capturedAt: p.capturedAt.toISOString(),
    enrichedAt: p.enrichedAt ? p.enrichedAt.toISOString() : null,
  }
}
