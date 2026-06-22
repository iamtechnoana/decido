# DECIDO — Canlıya Alma (Deployment) Kılavuzu

**Sürüm:** 0.1.0 · **Tarih:** 2026-06-19

Bu belge DECIDO'nun Vercel'e güvenli dağıtımı için adımları tanımlar. DECIDO Next.js olduğundan
dağıtım **Vercel-native**'dir (Docker yok — bkz. ADR 0001).

## 0. Repo Stratejisi (GitHub oto-deploy)

DECIDO, BERTALANFFY monorepo'sunun içinde (`build/products/decido`) geliştirilir. Monorepo'nun
tamamı (diğer IP, pitch'ler, secret'lar) **GitHub'a gönderilmez.** DECIDO için **ayrı bir
private GitHub repo** kullanılır (`bertalanffylabs/decido`):

* Yalnız `build/products/decido/` içeriği bu repo'ya gider (kök = proje kökü).
* Vercel bu repo'ya bağlanır → `main`'e push = üretim dağıtımı; PR'lar preview URL alır.
* `.gitignore` zaten `.env`, `node_modules`, `.next`, `dev.db`, `dev.log`'u dışlar — doğrula.
* **`/preview` ve geçici debug route'ları repo'ya girmemeli** (sadece geliştirme aracı).

## 1. Hazırlık ve Güvenlik

* **API anahtarları:** Üretim için geçerli `ANTHROPIC_API_KEY` ve `DECIDO_API_KEY` hazır
  bulundurun. Kesinlikle koda gömülmez; yalnız Vercel ortam değişkenlerinde tutulur.
* **Git temizliği:** Dağıtılacak kodun `master` dalında ve `eslint` + `build`'den geçtiğinden
  emin olun. `.gitignore`'un `.env`'i dışladığını doğrulayın.

## 2. Veritabanı

**Şema sağlayıcısını değiştir:** `prisma/schema.prisma` içinde `provider = "sqlite"` →
`provider = "postgresql"`. (sqlite yalnız yerel geliştirme içindi.) Bu commit'lenir.

> Yerel geliştirme: artık `DATABASE_URL`'i bir Postgres'e (Neon ücretsiz dev branch ya da
> yerel postgres) yönlendir; sqlite kolaylığı bırakılır. Json alanları (`tags`/`specs`/`tldr`)
> Postgres'te native `jsonb` olur — kod değişikliği gerekmez.

Vercel Marketplace'ten bir Postgres sağlayıcısı bağlayın (**Neon** veya **Supabase** —
Vercel Postgres artık sunulmuyor). Bağlantı dizesi `DATABASE_URL` olarak otomatik enjekte
edilir. İlk kurulumda şemayı uygulayın:

```bash
npm run db:push        # veya prisma migrate deploy (migration kullanılıyorsa)
```

## 3. Ortam Değişkenleri (Vercel → Project → Settings → Environment Variables)

> **Not (ADR 0007):** Proje çok-sağlayıcılı LLM kullanır; üretimde varsayılan **OpenRouter**
> (`openai/gpt-4o-mini`). OpenRouter ücretsiz modelleri güvenilmez (404/429) — **paralı ucuz
> model kullan.** Anthropic/OpenAI doğrudan da seçilebilir.

| Değişken | Zorunlu | Açıklama |
|----------|:---:|----------|
| `DATABASE_URL` | ✅ | Postgres bağlantısı (Neon/Supabase Marketplace'ten otomatik) |
| `LLM_PROVIDER` | ✅ | `openrouter` \| `anthropic` \| `openai` (üretim: openrouter) |
| `OPENROUTER_API_KEY` | ✅* | OpenRouter anahtarı (provider=openrouter ise) |
| `ENRICH_MODEL` | ✅ | Çıkarım/enrich modeli (`openai/gpt-4o-mini`) |
| `COMPARE_MODEL` | ✅ | Karşılaştırma/TL;DR modeli (`openai/gpt-4o-mini` veya güçlü) |
| `SUMMARY_MODEL` | — | TL;DR için (boşsa COMPARE_MODEL'e düşer) |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | — | Yalnız o provider seçilirse |
| `DECIDO_API_KEY` | ✅ | Eklenti + Telegram webhook paylaşılan sırrı (rastgele üret) |
| `DECIDO_APP_PASSWORD` | ✅ | PWA giriş parolası |
| `CRON_SECRET` | ✅ | Vercel cron `Authorization: Bearer` doğrulaması (price-check/maintenance) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Uygulamanın public URL'i (deploy sonrası gerçek URL) |
| `TELEGRAM_BOT_TOKEN` | — | Telegram yakalama (opsiyonel) |
| `TELEGRAM_ALLOWED_USER_ID` | — | İzinli Telegram kullanıcı ID'i |

## 4. Yayına Alma Adımları

1. Repoyu Vercel'e bağla (GitHub entegrasyonu) — `master`'a her push üretim dağıtımı tetikler;
   PR'lar otomatik preview URL alır.
2. `build` komutu: `prisma generate && next build` (package.json'da tanımlı).
3. İlk dağıtımda DB şemasını uygula (Adım 2).
4. Telegram webhook'unu bir kez kur:
   ```
   https://api.telegram.org/bot<TOKEN>/setWebhook?url=<APP_URL>/api/telegram?secret=<DECIDO_API_KEY>
   ```

## 5. Doğrulama (Health Check)

* `<APP_URL>/login` → 200, sayfa render oluyor.
* `<APP_URL>/manifest.webmanifest` → 200.
* Telegram bota link at → kayıt görünüyor.
* `CHANGELOG.md`'deki son sürümün canlıda aktif olduğunu doğrula.

## 6. Geri Alma (Rollback)

Vercel-native rollback: **Deployments** sekmesinden önceki kararlı dağıtımı **"Promote to
Production"** ile geri al (anında, yeniden build gerektirmez). Alternatif olarak Semantik
Sürümleme etiketiyle önceki sürüme dön:

```bash
git checkout tags/v0.1.0
git push origin HEAD:master --force-with-lease   # dikkatli kullan
```

Hata düzeltildikten sonra SemVer kurallarına göre yeni bir yama (patch) sürümü yayınla ve
`CHANGELOG.md`'yi güncelle.

## 7. Cron'lar (Faz 2 + Faz 3)

`vercel.json` iki günlük cron tanımlar: `/api/price-check` (`0 9 * * *`, fiyat takibi) ve
`/api/maintenance` (`0 7 * * *`, TTL süpürme — süresi dolmuş inbox öğelerini arşivler). Vercel cron isteğine
otomatik `Authorization: Bearer <CRON_SECRET>` ekler; bu yüzden `CRON_SECRET` ortam
değişkenini ayarla (route bunu kabul eder). Yerelde cron yoktur — UI'daki "Fiyatları kontrol
et" butonu manuel tetikler. Telegram bildirimi için `TELEGRAM_BOT_TOKEN` +
`TELEGRAM_ALLOWED_USER_ID` ayarla (yoksa uygulama-içi sinyal yine çalışır). Bkz.
`docs/adr/0008-fiyat-takibi.md`.
