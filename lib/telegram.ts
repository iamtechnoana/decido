const TELEGRAM_API = 'https://api.telegram.org'

/** Token/chat placeholder mı (kurulmamış mı) kontrolü. */
function isConfigured(token?: string, chatId?: string): boolean {
  if (!token || !chatId) return false
  if (token.includes('123456') || chatId.includes('123456789')) return false // .env.example placeholder
  return true
}

/** Belirli bir chat'e mesaj gönder (bot webhook yanıtları için). */
export async function sendTelegramTo(chatId: number | string, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return false
  try {
    const r = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    })
    return r.ok
  } catch {
    return false
  }
}

/** Sahibe (TELEGRAM_ALLOWED_USER_ID) bildirim gönder. Telegram kurulu değilse sessizce false. */
export async function notifyOwner(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_ALLOWED_USER_ID
  if (!isConfigured(token, chatId)) return false
  return sendTelegramTo(chatId!, text)
}
