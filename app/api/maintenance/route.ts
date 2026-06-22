import { NextResponse } from 'next/server'
import { checkApiKey, isLoggedIn } from '@/lib/auth'
import { runTtlSweep } from '@/lib/maintenance'

export const runtime = 'nodejs'
export const maxDuration = 120

/** Vercel Cron, isteğe `Authorization: Bearer <CRON_SECRET>` ekler. */
function isCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

/**
 * Günlük bakım: TTL süpürme (süresi dolmuş inbox → arşiv).
 * Tetikleyiciler: Vercel Cron (CRON_SECRET) · API anahtarı · giriş yapmış oturum (UI butonu).
 */
async function handle(req: Request) {
  const authorized = isCron(req) || checkApiKey(req) || (await isLoggedIn())
  if (!authorized) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  try {
    const ttl = await runTtlSweep()
    return NextResponse.json({ ttl })
  } catch (err) {
    console.error('[decido] maintenance hatası', err)
    return NextResponse.json({ error: 'maintenance failed' }, { status: 500 })
  }
}

export const GET = handle
export const POST = handle
