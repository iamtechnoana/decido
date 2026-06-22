import { NextResponse } from 'next/server'
import { verifyPassword, setSession, clearSession } from '@/lib/auth'

export const runtime = 'nodejs'

/** Passphrase ile tek-kullanıcı girişi. */
export async function POST(req: Request) {
  let body: { password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  if (!verifyPassword(body.password ?? '')) {
    return NextResponse.json({ error: 'hatalı parola' }, { status: 401 })
  }
  await setSession()
  return NextResponse.json({ ok: true })
}

/** Çıkış. */
export async function DELETE() {
  await clearSession()
  return NextResponse.json({ ok: true })
}
