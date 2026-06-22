# DECIDO — Sistem Mimari Belgesi (SAD)

**Sürüm:** 0.1.0 · **Tarih:** 2026-06-19

Hafif sistem mimari dokümanı. Mimari kararların gerekçeleri `docs/adr/` altındadır.

## 1. Vizyon ve Kapsam

DECIDO; ürün linklerini yakalayan, içeriklerini çıkaran, kategoriye göre gruplayan ve grup
içinde AI ile karşılaştıran tek-kullanıcılık bir Next.js uygulamasıdır. Hedef: dağınık
"beğendiklerim" havuzunu yapılandırılmış bir karar sürecine dönüştürmek.

## 2. Makro Mimari

```
   Yakalama kanalları                Çekirdek                       Arayüz
 ┌────────────────────┐
 │ Tarayıcı eklentisi │──┐
 │ Telegram botu      │──┼──► POST /api/capture ──► extractor ──► Postgres ◄── PWA (Next.js)
 │ PWA yapıştır formu │──┘        (lib/capture)     (Tier1→Tier3)     ▲          │
 └────────────────────┘                │                              │          ▼
                                        ▼ (async)                      │     /api/compare
                                   enrich (Haiku)──► kategori/spec/tag ─┘   (Sonnet, cache'li)
```

## 3. Katmanlar (tek sorumluluk)

| Katman | Konum | Sorumluluk | Bağımlılık |
|--------|-------|-----------|-----------|
| Yakalama | `lib/capture.ts` | dedup → çıkar → kaydet → async enrich tetikle | extractor, enrich, prisma |
| Çıkarım | `lib/extractor.ts` | OG/schema.org (Tier1) → LLM fallback (Tier3) | cheerio, ai |
| Zenginleştirme | `lib/enrich.ts` | kategori/spec/tag (Haiku) | ai |
| Karşılaştırma | `lib/compare.ts` | grup-içi tablo+skor+öneri, cache | ai, prisma |
| Yakalama (Faz 3) | `lib/capture.ts` | anında kaydet (inbox+TTL) + `after()` arka plan boru hattı | extractor, enrich, needmap |
| İhtiyaç eşleme (Faz 3) | `lib/needmap.ts` | kategori sayısı + son 6 ay alım + başlık benzerliği | prisma |
| TL;DR özet (Faz 4) | `lib/summary.ts` | artı/eksi/fark/ideal-kullanıcı (sayfa+bilgi, güçlü model) | ai |
| Bakım/TTL (Faz 3) | `lib/maintenance.ts` | süresi dolmuş inbox → arşiv (cron) | prisma |
| Fiyat takibi (Faz 2) | `lib/pricecheck.ts` | periyodik Tier-1 fiyat çek, geçmişe yaz, alarm | extractor, telegram, prisma |
| Bildirim | `lib/telegram.ts` | `notifyOwner` / `sendTelegramTo` | — |
| Serileştirme | `lib/serialize.ts` | Prisma satırı → `ProductDTO` (priceHistory dahil) | types |
| LLM erişimi | `lib/ai.ts` | çok-sağlayıcı client + JSON ayıklama (`jsonFromLLM`) | openai, @anthropic-ai/sdk |
| Veri | `lib/prisma.ts` + `prisma/schema.prisma` | kalıcılık, singleton client | @prisma/client |
| Auth | `lib/auth.ts` | API anahtarı (makine) + cookie passphrase (PWA) | next/headers |
| API | `app/api/*` | capture, telegram, compare, products, login | yukarıdaki lib'ler |
| UI | `app/`, `components/` | login, kova listesi, düzenleme, karşılaştırma paneli | types |

## 4. Veri Akışı

1. **Yakalama:** kanal → `/api/capture` (yetki) → `captureUrl()` → dedup → `extractProduct()` →
   `Product` (status=candidate) → async `enrichProduct()`.
2. **Görüntüleme:** `/` (server) auth + `Product` listesi → `Board` (client) kategoriye göre kova.
3. **Karşılaştırma:** kullanıcı kovayı açar → `/api/compare` → imza kontrolü → cache veya
   Sonnet → tablo+skor; skorlar `Product`'a geri yazılır.

## 5. Veri Modeli (özet)

* **Product** — url(unique), domain, source, title/imageUrl/description/price/currency,
  category/tags/specs, score/scoreReason, notes, bucketId, extractionTier,
  targetPrice/alertEnabled (Faz 2), capturedAt/enrichedAt.
  * **status** (Faz 3 durum makinesi): `inbox` → `candidate` → `bought`; her aşamadan `archived`.
  * **Yaşam döngüsü** (Faz 3): expiresAt(TTL) · reviewedAt · remindAt · archivedAt · archiveReason ·
    needSignal(Json).
* **Bucket** — kullanıcı-tanımlı karar kovası (opsiyonel; varsayılan gruplama AI category).
* **PriceCheck** (Faz 2) — periyodik fiyat ölçümleri.
* **ComparisonCache** — groupKey + signature + result (karşılaştırma cache'i).

## 6. Güvenlik

* İki yetki yolu (bkz. ADR 0005): makine = `DECIDO_API_KEY`, PWA = `DECIDO_APP_PASSWORD` cookie.
* Telegram webhook `?secret=` ile korunur; yalnız `TELEGRAM_ALLOWED_USER_ID` işlenir.
* Tüm secret'lar `.env`'de; `.gitignore` ile dışlanır.

## 7. Dağıtım Topolojisi

Tek Next.js uygulaması Vercel'de. Postgres harici (Neon/Supabase). LLM harici (çok-sağlayıcı).
Faz 2 fiyat kontrolü Vercel Cron → `/api/price-check` (günlük). Ayrıntı: `docs/deployment/vercel.md`.

## 8. Ölçeklenme / Gelecek

* Tier 2 (Playwright JS-render) gerekirse ayrı bir işlev olarak eklenir (ADR 0004) — JS-fiyatlı
  sitelerin otomatik takibini de açar.
* Çok kullanıcı gerekirse auth katmanı değişir (ADR 0005).
* Otomatik test paketi (Vitest + Playwright) — bkz. `docs/qa/test-strategy.md`.
