import { NextResponse } from 'next/server'
import { isLoggedIn } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// Kullanıcının elle düzenleyebileceği / sistemin güncelleyebileceği alanlar.
const EDITABLE = new Set([
  'title', 'price', 'currency', 'imageUrl', 'description',
  'category', 'status', 'notes', 'bucketId', 'targetPrice', 'alertEnabled',
  'expiresAt', 'remindAt', 'archiveReason',
])

const DATE_FIELDS = new Set(['expiresAt', 'remindAt'])

/** Tek ürünü güncelle (manuel düzeltme, durum değişimi, kovaya taşıma). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isLoggedIn())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(body)) {
    if (!EDITABLE.has(k)) continue
    data[k] = DATE_FIELDS.has(k) && typeof v === 'string' ? new Date(v) : v
  }
  // Elle düzeltme yapıldıysa çıkarım katmanını 'manual' işaretle.
  if ('title' in data || 'price' in data || 'imageUrl' in data) {
    data.extractionTier = 'manual'
  }
  // Durum yaşam-döngüsü yan etkileri.
  if (data.status === 'archived') {
    data.archivedAt = new Date()
    data.archiveReason ??= 'manual'
  }
  if (data.status === 'candidate' || data.status === 'bought') {
    data.reviewedAt = new Date()
  }
  if (data.status === 'inbox') {
    // Eriyik'ten geri alma — arşiv izlerini temizle.
    data.archivedAt = null
    data.archiveReason = null
  }

  try {
    const product = await prisma.product.update({ where: { id }, data })
    return NextResponse.json({ product })
  } catch {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
}

/** Ürünü sil. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isLoggedIn())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
}
