import { cookies } from 'next/headers'

const SESSION_COOKIE = 'decido_session'

/**
 * Yakalama endpoint'leri (eklenti + bot) için paylaşılan API anahtarı kontrolü.
 * Authorization: Bearer <DECIDO_API_KEY> veya X-Api-Key header'ı kabul edilir.
 */
export function checkApiKey(req: Request): boolean {
  const expected = process.env.DECIDO_API_KEY
  if (!expected) return false
  const auth = req.headers.get('authorization')
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  const headerKey = req.headers.get('x-api-key')
  return bearer === expected || headerKey === expected
}

/** Tek-kullanıcı PWA oturumu: passphrase doğruysa cookie set edilir. */
export function verifyPassword(password: string): boolean {
  const expected = process.env.DECIDO_APP_PASSWORD
  return !!expected && password === expected
}

export async function isLoggedIn(): Promise<boolean> {
  const store = await cookies()
  return store.get(SESSION_COOKIE)?.value === process.env.DECIDO_APP_PASSWORD
}

export async function setSession(): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE, process.env.DECIDO_APP_PASSWORD ?? '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 yıl — kişisel kullanım
    path: '/',
  })
}

export async function clearSession(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}
