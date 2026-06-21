import { NextResponse } from 'next/server'
import { checkApiKey, isLoggedIn } from '@/lib/auth'
import { captureUrl, type ClientExtracted } from '@/lib/capture'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Ana yakalama endpoint'i.
 * Yetki: eklenti/bot için API anahtarı VEYA giriş yapmış PWA oturumu.
 * Gövde: { url: string, source?: "web" | "extension" | "telegram" }
 */
export async function POST(req: Request) {
  const authorized = checkApiKey(req) || (await isLoggedIn())
  if (!authorized) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: { url?: string; source?: string; extracted?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  if (!body.url || !/^https?:\/\//i.test(body.url)) {
    return NextResponse.json({ error: 'geçerli bir url gerekli' }, { status: 400 })
  }

  const source =
    body.source === 'extension' || body.source === 'telegram' ? body.source : 'web'

  // Eklenti canlı DOM'dan veri gönderdiyse sanitize et (sunucu çıkarımını atlar).
  let client: ClientExtracted | undefined
  const ex = body.extracted
  if (ex && typeof ex === 'object') {
    const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 2000) : null)
    const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
    const title = str(ex.title)
    if (title) {
      client = {
        title,
        imageUrl: str(ex.imageUrl),
        description: str(ex.description),
        price: num(ex.price),
        currency: str(ex.currency),
      }
    }
  }

  try {
    const result = await captureUrl(body.url, source, client)
    return NextResponse.json(result, { status: result.duplicate ? 200 : 201 })
  } catch (err) {
    console.error('[decido] capture hatası', err)
    return NextResponse.json({ error: 'capture failed' }, { status: 500 })
  }
}

// CORS preflight (tarayıcı eklentisi cross-origin POST yapar).
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key',
    },
  })
}
