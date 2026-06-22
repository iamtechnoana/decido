// Client/server arası paylaşılan hafif tipler (Prisma client'ı UI'a sızmaz).

export interface ProductDTO {
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
  tags: string[] | null
  specs: Record<string, string> | null
  score: number | null
  scoreReason: string | null
  status: string
  notes: string | null
  bucketId: string | null
  extractionTier: string | null
  targetPrice: number | null
  alertEnabled: boolean
  lastAlertedAt: string | null
  priceHistory: Array<{ price: number; at: string }>
  // Yaşam döngüsü (Faz 3)
  expiresAt: string | null
  archivedAt: string | null
  archiveReason: string | null
  needSignal: NeedSignalDTO | null
  tldr: TldrDTO | null
  capturedAt: string
  enrichedAt: string | null
}

export interface TldrDTO {
  pros: string[]
  cons: string[]
  edge: string
  idealUser: string
}

export interface NeedSignalDTO {
  sameCategoryCount: number
  recentBuys: number
  recentSpend: number
  similar: { id: string; title: string } | null
}

export interface CompareRow {
  id: string
  title: string
  score: number
  reason: string
  pros: string[]
  cons: string[]
  specs: Record<string, string>
}

export interface CompareResultDTO {
  specKeys: string[]
  rows: CompareRow[]
  winnerId: string | null
  summary: string
}
