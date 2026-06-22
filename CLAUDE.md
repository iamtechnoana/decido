# CLAUDE.md — DECIDO

Stratejik alışveriş karar asistanı. Beğenilen ürün linkleri yakalanır → otomatik çıkarılır →
kategoriye göre gruplanır → grup içinde AI karşılaştırır+puanlar → (Faz 2) iyi alım anında haber verir.

Kişisel ürün (tek kullanıcı), `build/products/` altında IP olarak tutulur.

## Mimari

```
[Eklenti] [Telegram bot] [PWA form] → POST /api/capture
   → extractor (Tier1 OG/schema → Tier3 LLM) → Postgres
   → (async) enrich (ucuz model: kategori+spec+tag)
PWA: kovalara bölünmüş liste → /api/compare (güçlü model, on-demand, cache'li)
```

**LLM:** çok-sağlayıcılı (`lib/ai.ts`). `LLM_PROVIDER` ile openrouter | anthropic | openai
seçilir (varsayılan başlangıç: OpenRouter). Modeller env'den (`ENRICH_MODEL`/`COMPARE_MODEL`).
Doğrudan SDK; Vercel AI Gateway DEĞİL. Bkz. ADR 0007 (0003'ü süpersede eder).

## Komutlar

```bash
npm run dev          # geliştirme (http://localhost:3000)
npm run build        # prisma generate + next build
npm run db:push      # şemayı veritabanına uygula (migration'sız)
npm run db:studio    # Prisma Studio
```

## Katmanlar

| Katman | Dosya | İş |
|--------|-------|----|
| Çıkarım | `lib/extractor.ts` | OG/schema.org → eksikse LLM fallback |
| Zenginleştirme | `lib/enrich.ts` | kategori/spec/tag (ucuz model) |
| Karşılaştırma | `lib/compare.ts` | grup-içi skor+tablo (güçlü model, `ComparisonCache`) |
| LLM erişimi | `lib/ai.ts` | çok-sağlayıcı (`jsonFromLLM`); openrouter\|anthropic\|openai |
| Yakalama | `lib/capture.ts` | dedup→**anında kaydet (inbox+TTL)**→`after()` arka plan (çıkar→enrich→**tldr**→needmap) |
| TL;DR özet | `lib/summary.ts` | 3-saniyelik özet: artı/eksi/fark/ideal (güçlü model, sayfa+bilgi) |
| İhtiyaç eşleme | `lib/needmap.ts` | kategori sayısı + son 6 ay alım + başlık benzerliği (dürtü farkındalığı) |
| Bakım/TTL | `lib/maintenance.ts` | süresi dolmuş inbox → arşiv (günlük cron) |
| Auth | `lib/auth.ts` | API anahtarı (eklenti/bot) + cookie passphrase (PWA) |

## Kritik kurallar

- Çıkarım **best-effort**: rastgele sitelerde %100 değil. Eksik alan UI'da elle düzeltilir (`extractionTier=manual`).
- Enrich **bloke etmez**: kayıt hemen görünür, kategori birkaç saniye sonra dolar (UI auto-refresh).
- Karşılaştırma **on-demand + cache**: kova içeriği (id+fiyat imzası) değişmedikçe yeniden hesaplanmaz.
- Gruplama anahtarı = AI `category`. Kategoriler arası kıyas yapılmaz; değer grup içindedir.
- Telegram webhook `?secret=DECIDO_API_KEY` ile korunur; sadece `TELEGRAM_ALLOWED_USER_ID` işlenir.
- Secret'lar `.env`'den. `.env` asla commit edilmez.

## Dokümantasyon disiplini (Bertalanffy çerçevesi)

Bu proje Bertalanffy Labs dokümantasyon standartlarını uygular. Değişiklik yaparken:

- **ADR:** Sistemin çalışma mantığını etkileyen kararlardan **önce** `docs/adr/` altına
  numaralı yeni ADR ekle (Nygard: Bağlam/Karar/Sonuçlar). Kabul edilmiş ADR değiştirilmez →
  `Superseded` ile yenisi yazılır. Mevcut: 0001-0006.
- **CHANGELOG:** Kullanıcıya dönük her önemli değişiklikte `CHANGELOG.md` `[Unreleased]`
  bölümünü güncelle (Keep a Changelog, ISO 8601, Added/Changed/Fixed…).
- **SemVer + Conventional Commits:** `feat:`→MINOR, `fix:`→PATCH, `BREAKING CHANGE:`→MAJOR.
  Dal: `feat/`, `fix/`, `docs/`, `refactor/`. Detay: `CONTRIBUTING.md`.
- **Belgeler kaynakla senkron:** yeni API/katman eklersen `docs/` (architecture, requirements)
  güncellensin. Belge yapısı: `docs/DIRECTORY_STRUCTURE.md`.
- **Lisans:** Tescilli (Bertalanffy Labs) — `LICENSE`.

## Faz durumu

- **Faz 1:** yakala + çıkar + grupla + grup-içi karşılaştır/puanla. Üç yakalama akışı.
- **Faz 2 (tamam):** fiyat takibi — alarmı açık ürünler periyodik Tier-1 ile yeniden fiyatlanır
  (`/api/price-check`, Vercel Cron `vercel.json` / manuel buton), hedef-altı çapraz veya yeni
  en-düşükte uygulama-içi sinyal + Telegram (`notifyOwner`). Sparkline + EditModal alarm aç/kapa.
  `lib/pricecheck.ts`, `lib/telegram.ts`. Bkz. ADR 0008.
- **Faz 3 (tamam):** Birikim & yaşam döngüsü. Anında yakalama (`after()`, ~300ms, kayıt inbox'a
  düşer, detay arka planda) · durum makinesi `inbox→candidate→bought`/`archived` · TTL (30g, günlük
  `/api/maintenance` cron süresi dolanı arşivler, "Uzat") · Görsel Eriyik (geri al/tamamen sil) ·
  İhtiyaç Eşleme (`lib/needmap.ts` — dürtü farkındalığı). Bkz. ADR 0009, 0010.
- **Faz 4 (tamam):** TL;DR özet kartları — 3-saniyelik artı/eksi/fark/ideal-kullanıcı özeti,
  arka planda güçlü modelle (`lib/summary.ts`), "AI özeti" etiketli. Bkz. ADR 0011.
- **Sonra:** swipe/Seyir-Karar modları/Seçme Asistanı (Faz 5) · Tier-2 Playwright, web-arama özet,
  otomatik test paketi (Faz 6).

## Veritabanı

Üretim: Postgres (Neon/Supabase). Yerel hızlı test için SQLite'a geçiş README'de.
Şema değişince `npm run db:push` (veya migration). `tags`/`specs` Json (taşınabilirlik).
