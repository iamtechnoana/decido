import { NextResponse } from 'next/server'
import { captureUrl, firstUrl } from '@/lib/capture'
import { sendTelegramTo } from '@/lib/telegram'

export const runtime = 'nodejs'
export const maxDuration = 60

async function reply(chatId: number, text: string): Promise<void> {
  await sendTelegramTo(chatId, text)
}

/**
 * Telegram bot webhook. Kurulum (bir kez):
 *   https://api.telegram.org/bot<TOKEN>/setWebhook?url=<APP_URL>/api/telegram?secret=<DECIDO_API_KEY>
 * Sadece TELEGRAM_ALLOWED_USER_ID'den gelen mesajlar işlenir.
 */
export async function POST(req: Request) {
  // Webhook gizli kontrolü (query secret).
  const secret = new URL(req.url).searchParams.get('secret')
  if (!process.env.DECIDO_API_KEY || secret !== process.env.DECIDO_API_KEY) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  type TgMessage = {
    chat?: { id?: number }
    from?: { id?: number }
    text?: string
  }
  let update: { message?: TgMessage; edited_message?: TgMessage }
  try {
    update = await req.json()
  } catch {
    return NextResponse.json({ ok: true }) // Telegram'a hata döndürme; retry fırtınası olmasın.
  }

  const msg = update?.message ?? update?.edited_message
  const chatId: number | undefined = msg?.chat?.id
  const fromId: number | undefined = msg?.from?.id
  const text: string = msg?.text ?? ''

  if (!chatId) return NextResponse.json({ ok: true })

  const allowed = process.env.TELEGRAM_ALLOWED_USER_ID
  if (allowed && String(fromId) !== String(allowed)) {
    await reply(chatId, 'Bu bot özeldir.')
    return NextResponse.json({ ok: true })
  }

  const url = firstUrl(text)
  if (!url) {
    await reply(chatId, 'Bir ürün linki gönder, DECIDO listene ekleyeyim.')
    return NextResponse.json({ ok: true })
  }

  try {
    const result = await captureUrl(url, 'telegram')
    const head = result.duplicate ? '↻ Zaten listende' : '✓ Eklendi'
    await reply(chatId, `${head}: ${result.title ?? url}`)
  } catch (err) {
    console.error('[decido] telegram capture hatası', err)
    await reply(chatId, '⚠ Eklenemedi, sonra tekrar dene.')
  }

  return NextResponse.json({ ok: true })
}
