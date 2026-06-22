# DECIDO

`sürüm 0.1.0` · `tescilli — Bertalanffy Labs`

**Stratejik alışveriş karar asistanı.** Gezerken beğendiğin ürün linklerini anında yakala,
kategoriye göre otomatik grupla, grup içinde AI ile karşılaştır + puanla, doğru zamanda al.

> Model: **yakala → çıkar → grupla → karşılaştır → (Faz 2) alım anında haber ver.**
> Kategoriler arası kıyas anlamsız; değer **grup içi** seçimdedir.

## Özellikler (Faz 1)

- **3 yakalama yolu**: tarayıcı eklentisi · Telegram botu · PWA'da link yapıştırma
- **Katmanlı çıkarım**: Open Graph / schema.org → eksikse Claude ile metin çıkarımı → elle düzeltme
- **Otomatik gruplama**: AI kategori atar, benzer ürünler aynı kovaya düşer
- **Grup-içi AI karşılaştırma**: özellik tablosu + 0-100 skor + "önde olan" önerisi (cache'li)
- **Durumlar**: aday / alındı / elenen + notlar
- **PWA**: telefona "Ana ekrana ekle" ile kurulabilir

## Kurulum

```bash
cd build/products/decido
npm install
cp .env.example .env        # değerleri doldur (aşağıya bak)
npm run db:push             # şemayı veritabanına uygula
npm run dev                 # http://localhost:3000
```

### Ortam değişkenleri (`.env`)

| Değişken | Ne işe yarar |
|----------|--------------|
| `LLM_PROVIDER` | `openrouter` \| `anthropic` \| `openai` (boşsa dolu anahtara göre otomatik) |
| `OPENROUTER_API_KEY` | OpenRouter (başlangıç için önerilen — içinden Claude/GPT çağrılır) |
| `ANTHROPIC_API_KEY` | Doğrudan Claude (anahtarın olunca) — opsiyonel |
| `OPENAI_API_KEY` | Doğrudan OpenAI — opsiyonel |
| `ENRICH_MODEL` / `COMPARE_MODEL` | Model adları (boşsa sağlayıcıya göre varsayılan) |
| `DATABASE_URL` | Postgres bağlantısı |
| `DECIDO_API_KEY` | Eklenti + Telegram webhook'unu koruyan paylaşılan sır |
| `DECIDO_APP_PASSWORD` | PWA girişi (tek kullanıcı parolası) |
| `TELEGRAM_BOT_TOKEN` | @BotFather'dan bot token'ı |
| `TELEGRAM_ALLOWED_USER_ID` | Sadece senin Telegram kullanıcı ID'in işlenir |

### Yerel hızlı test için SQLite (opsiyonel)

Postgres kurmadan denemek istersen `prisma/schema.prisma` içinde
`provider = "postgresql"` → `"sqlite"` yap ve `DATABASE_URL="file:./dev.db"` ver, sonra `npm run db:push`.
(`tags`/`specs` zaten Json olduğundan taşınabilir.)

## Yakalama akışlarını bağlama

**Tarayıcı eklentisi:** `chrome://extensions` → Geliştirici modu → "Paketlenmemiş yükle" → `extension/`
klasörünü seç. Popüp → Ayarlar → DECIDO adresi + API anahtarı gir.

**Telegram botu:** @BotFather'dan token al, `.env`'e koy, sonra webhook'u bir kez kur:

```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=<APP_URL>/api/telegram?secret=<DECIDO_API_KEY>
```

Artık bota ürün linki at → listene düşer.

## Dağıtım

Vercel'e deploy et, `DATABASE_URL` için Marketplace'ten Neon/Supabase bağla, ortam
değişkenlerini ekle. `npm run build` üretim derlemesini yapar (`prisma generate` dahil).

## Dokümantasyon

| Belge | İçerik |
|-------|--------|
| [docs/PRD.md](docs/PRD.md) | Ürün vizyonu, hedef kitle, KPI |
| [docs/requirements.md](docs/requirements.md) | Fonksiyonel/fonksiyonel olmayan gereksinimler (SRS) |
| [docs/architecture/system-design.md](docs/architecture/system-design.md) | Sistem mimarisi (katmanlar, akış, güvenlik) |
| [docs/adr/](docs/adr/) | Mimari Karar Kayıtları (0001-0006) |
| [docs/qa/test-strategy.md](docs/qa/test-strategy.md) | Test stratejisi ve kalite standartları |
| [docs/deployment/vercel.md](docs/deployment/vercel.md) | Vercel dağıtım kılavuzu |
| [docs/DIRECTORY_STRUCTURE.md](docs/DIRECTORY_STRUCTURE.md) | Klasör/dosya ağacı |
| [CHANGELOG.md](CHANGELOG.md) · [CONTRIBUTING.md](CONTRIBUTING.md) · [LICENSE](LICENSE) | Sürüm geçmişi · katkı disiplini · lisans |

## Riskler / sınırlar

- **Scraping güvenilirliği** en kırılgan parça — anti-bot ve JS ile yüklenen fiyatlar bazı sitelerde
  çıkarımı eksik bırakabilir. Katmanlı çıkarım + elle düzeltme bunu absorbe eder; %100 otomasyon vaat edilmez.
- **Fiyat takibi/alarm** bilinçli olarak **Faz 2**'ye bırakıldı (şema hazır, scheduler yok).
