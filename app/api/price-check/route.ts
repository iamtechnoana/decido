import { NextResponse } from 'next/server'
import { checkApiKey, isLoggedIn } from '@/lib/auth'
import { runPriceChecks } from '@/lib/pricecheck'

export const runtime = 'nodejs'
export const maxDuration = 300

/** Vercel Cron, isteğe `Authorization: Bearer <CRON_SECRET>` ekler. */
function isCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

/**
 * Periyodik fiyat kontrolü. Tetikleyiciler:
 *  - Vercel Cron (CRON_SECRET) — üretim
 *  - API anahtarı (DECIDO_API_KEY) — harici
 *  - Giriş yapmış oturum — UI'daki "Fiyatları kontrol et" butonu (yerel test)
 */
async function handle(req: Request) {
  const authorized = isCron(req) || checkApiKey(req) || (await isLoggedIn())
  if (!authorized) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  try {
    const summary = await runPriceChecks()
    return NextResponse.json(summary)
  } catch (err) {
    console.error('[decido] price-check hatası', err)
    return NextResponse.json({ error: 'price-check failed' }, { status: 500 })
  }
}

// Vercel Cron GET ile çağırır; UI POST ile.
export const GET = handle
export const POST = handle
