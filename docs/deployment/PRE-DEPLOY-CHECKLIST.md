# DECIDO — Pre-Deploy Checklist (Go / No-Go)

Her üretim dağıtımından **önce** bu liste tamamlanır. Tek bir madde ❌ ise → **No-Go.**
Ayrıntılı adımlar: [`vercel.md`](./vercel.md).

## 1. Kod & Kalite
- [ ] `npm run build` yerelde **postgres şemasıyla** sorunsuz geçiyor
- [ ] `npm test` → tüm testler yeşil
- [ ] `npx tsc --noEmit` → 0 hata
- [ ] `npm run lint` → temiz
- [ ] Geliştirme-only artefaktlar repo'da **yok**: `app/preview/`, `app/api/debug-*`, `dev.log`, `dev.db`

## 2. Güvenlik
- [ ] `.env` git'e **girmiyor** (`.gitignore` doğrulandı); hiçbir secret kodda hardcode değil
- [ ] Tüm secret'lar yalnız **Vercel env vars**'ta (kod/commit'te değil)
- [ ] `DECIDO_API_KEY` ve `DECIDO_APP_PASSWORD` güçlü/rastgele
- [ ] Yetkili route'lar korunuyor: `/api/capture` (API key/oturum), cron'lar (`CRON_SECRET`), telegram (`?secret=`)
- [ ] `.env.example` güncel (değer yok, sadece anahtar adları)

## 3. Veritabanı
- [ ] `prisma/schema.prisma` → `provider = "postgresql"` (commit'li)
- [ ] Üretim Postgres (Neon/Supabase) bağlı, `DATABASE_URL` Vercel'de
- [ ] İlk deploy sonrası `prisma db push` (veya migrate) ile şema uygulandı

## 4. Config / Env (bkz. vercel.md §3)
- [ ] Zorunlu env'ler Vercel'de set: `DATABASE_URL`, `LLM_PROVIDER`, `OPENROUTER_API_KEY`,
      `ENRICH_MODEL`, `COMPARE_MODEL`, `DECIDO_API_KEY`, `DECIDO_APP_PASSWORD`,
      `CRON_SECRET`, `NEXT_PUBLIC_APP_URL`
- [ ] LLM modeli **çalışan paralı** model (free değil) — OpenRouter kredisi var
- [ ] `vercel.json` cron'ları doğru (`/api/price-check`, `/api/maintenance`)

## 5. Repo / Vercel
- [ ] DECIDO ayrı private repo'da (`bertalanffylabs/decido`), monorepo değil
- [ ] Vercel projesi repo'ya bağlı; build komutu `prisma generate && next build`
- [ ] Production branch = `main`

## 6. Deploy sonrası doğrulama (Health Check)
- [ ] `<APP_URL>/login` → 200, render oluyor; giriş çalışıyor
- [ ] `<APP_URL>/manifest.webmanifest` → 200
- [ ] Web formundan bir link yakala → kart işleniyor → başlık/görsel geliyor
- [ ] Eklenti endpoint'i → `<APP_URL>` güncellendi; eklentiyle yakalama çalışıyor
- [ ] `CHANGELOG.md` son sürümü canlıda
- [ ] (Opsiyonel) Telegram webhook kuruldu + test edildi

## 7. Geri Alma Hazır
- [ ] Rollback yolu biliniyor (Vercel → Deployments → önceki → "Promote to Production")
