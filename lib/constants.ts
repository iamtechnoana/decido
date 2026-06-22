// DECIDO sabitleri

/** Yeni kaydın varsayılan ömrü (gün). Süre sonunda inbox'tan otomatik arşivlenir. */
export const DEFAULT_TTL_DAYS = 30

/** "Uzat" aksiyonunun eklediği gün. */
export const EXTEND_TTL_DAYS = 14

/** Kartta "yakında dolacak" uyarısının eşiği (gün). */
export const EXPIRING_SOON_DAYS = 3

export const DAY_MS = 24 * 60 * 60 * 1000

export function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * DAY_MS)
}
