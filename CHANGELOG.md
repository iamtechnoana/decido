# Changelog

DECIDO'daki tüm önemli değişiklikler bu dosyada belgelenir.

Biçim [Keep a Changelog](https://keepachangelog.com/) temellidir ve proje
[Semantic Versioning](https://semver.org/) kullanır. Tarihler ISO 8601 (YYYY-MM-DD).

## [Unreleased]

### Added
- **UX/UI yenileme (Faz 3 — Kart sadeleştirme + detay):** progressive disclosure. Kart artık
  yalnızca özü gösterir (görsel, başlık, fiyat, skor, **tek** öncelikli sinyal, birincil aksiyon
  + "Detay →"). TL;DR, ihtiyaç-eşleme, fiyat geçmişi/sparkline, spec/etiket, notlar ve ikincil
  aksiyonlar yeni **tam-ekran detay görünümüne** indi (`ProductDetail`); kart gövdesine
  dokununca veya "Detay" ile açılır, "Mağazada aç" linki orada. Tarama belirgin hızlandı.
- **UX/UI yenileme (Faz 5 — Cila):** işlenmekte olan ürünler için **skeleton** (shimmer'lı
  iskelet kart, "işleniyor…" metni yerine); kartlarda **dokunmatik swipe** (sağ = Tut, sol =
  Arşivle; butonlar da çalışır); kademeli kart girişi animasyonu; flash bildirimleri **toast**
  olarak (otomatik kaybolur); `prefers-reduced-motion` desteği.

### Fixed
- Hydration uyumsuzluğu: `Board.thisWeek` ve `ProductCard` TTL rozeti render-içi `Date.now()`
  yerine mount sonrası hesaplanıyor (SSR uyarısı giderildi).
- **Çıkarım dayanıklılığı:** bot-koruma/engelleme sayfaları artık tespit ediliyor — "Access Denied"
  gibi çöp başlıklar kaydedilmiyor, ürün `blocked` işaretleniyor. Daha gerçekçi tarayıcı
  header'ları (Accept-Language, Sec-Fetch, sec-ch-ua) bazı basit blokları aşar. Çıkarımı
  başarısız/bloklu kartlar sonsuz "işleniyor" iskeleti yerine **"site engelledi — Düzelt"**
  fallback'i gösterir (gerçek "işleniyor" durumu `extractionTier` ile ayrışır).

### Added (önceki — UX/UI)
- **UX/UI yenileme (Faz 4 — Karar anı / verdict):** AI karşılaştırma küçük tablodan
  "kazanan-kahraman" görünüme çevrildi: "★ En iyi seçim" damgası, büyük kazanan adı + skor
  mührü, gerekçe pull-quote'u (serif italik), artı/eksi, **"Bunu seç"** (kazananı aday yapar).
  Diğer ürünler sıralı liste. Ayrıntılı spec karşılaştırma tablosu "Fark nerede?" ile
  açılır (progressive disclosure). `VerdictView` ayrı export.
- **UX/UI yenileme (Faz 2 — Mobil kabuk):** mobil-önce navigasyon. Alt navigasyon çubuğu
  (durum sekmeleri: İncele / Aday / Alındı) + ortada **FAB "+"** ile yakalama; "Diğer" sayfası
  (Eriyik arşivi + Fiyat kontrol / Bakım / Yenile / Çıkış — ana çatıdan indirildi). Yakalama
  artık alttan açılan **bottom-sheet**'te. **PWA Share Target**: başka uygulamadan "Paylaş →
  DECIDO" ile link doğrudan yakalama sayfasını ön-doldurur (`manifest.share_target`). Üst künye
  aktif filtreyi gösterir.
- **UX/UI yenileme (Faz 1 — Tasarım sistemi):** arayüz "Karar Gazetesi" editoryal yönüne
  taşındı. Açık + koyu tema (CSS token sistemi + `prefers-color-scheme` + manuel `ThemeToggle`,
  localStorage kalıcı, FOUC'suz inline script). Tipografi: Bricolage Grotesque (başlık/skor) +
  Newsreader (serif gövde). Editoryal taban sınıflar (künye, kicker, skor, damga/mühür,
  pull-quote). `Board` ve `ProductCard` inline stilden tasarım sistemine geçirildi; dev-ops
  butonları ikincil alana indi. İki yön mockup'landı (`/mockup` = "sakin enstrüman",
  `/mockup-b` = "Karar Gazetesi"); Yön B seçildi. Sonraki: F2 mobil kabuk (alt-nav + FAB +
  PWA Share Target), F4 karar anı (verdict-kahraman).

### Changed
- Durum sekme etiketi: "İncelenmemiş" → "İncele".

### Added (önceki)
- **Faz 4 — TL;DR Özet Kartları:** her ürün için "3 saniyelik özet" (🟢 artılar · 🔴 eksiler ·
  ⚡ fark · 🎯 ideal kullanıcı), kartta "AI özeti" etiketiyle. Kaynak: sayfa metni + model bilgisi
  (web arama sonraki faz). Capture boru hattının 3. adımı olarak `after()` ile arka planda, güçlü
  `SUMMARY_MODEL` ile üretilir; çıkarımdaki `pageText` paylaşılır (çift fetch yok). `lib/summary.ts`.
  Bkz. `docs/adr/0011-tldr-ozet.md`.
- **Faz 3 — Birikim & Yaşam Döngüsü (anti-impulse çekirdeği):**
  - **Anında yakalama:** link tek tıkla ~300ms'de kaydedilir (önceki ~10-25sn bloke); çıkarım +
    enrich + ihtiyaç-eşleme `after()` (next/server) ile arka planda. Kart "⏳ işleniyor…" gösterir.
  - **Inbox-önce durum makinesi:** `inbox` (İncelenmemiş, varsayılan) → `candidate` → `bought`;
    her aşamadan `archived` (Eriyik, soft-delete). Eski `dismissed` kaldırıldı.
  - **TTL / ömür:** kayda 30 günlük ömür; günlük cron (`/api/maintenance`) süresi dolmuş inbox
    ürünleri otomatik arşivler; "Uzat" (+14g) + "yakında dolacak" rozeti.
  - **Görsel Eriyik:** arşiv sekmesi + Geri al + Tamamen sil.
  - **İhtiyaç Eşleme:** kategori sayısı + son 6 ay alım/harcama + başlık benzerliği → dürtü
    farkındalığı rozeti (bloke etmez). `lib/needmap.ts`.
  - **Özet bandı:** "Bu hafta N kayıt · M incelenmemiş".
  - Bkz. `docs/adr/0009-inbox-yasam-dongusu.md`, `docs/adr/0010-ihtiyac-eslemesi.md`.
- **Faz 2 — Fiyat takibi ve alarm:** alarmı açık ürünlerin fiyatı periyodik olarak Tier-1
  (OG/schema, LLM'siz) ile yeniden çekilir; `PriceCheck` geçmişine yazılır. Hedef fiyatın
  altına *inince* veya yeni en-düşük görülünce uygulama-içi sinyal (🎯/⬇) + Telegram bildirimi
  (`notifyOwner`, kuruluysa). `/api/price-check` (Vercel Cron · API anahtarı · oturum),
  `vercel.json` günlük cron, UI'da "Fiyatları kontrol et" butonu, ProductCard'da sinyal +
  fiyat geçmişi sparkline'ı, EditModal'da alarm aç/kapa. Bkz. `docs/adr/0008-fiyat-takibi.md`.

### Changed
- LLM erişimi çok-sağlayıcılı yapıldı: `LLM_PROVIDER` ile OpenRouter / Anthropic / OpenAI
  seçimi; modeller env'den ayarlanabilir (`ENRICH_MODEL`/`COMPARE_MODEL`). Başlangıç için
  OpenRouter varsayılan. `lib/ai.ts` artık `jsonFromLLM()` sunar
  (bkz. `docs/adr/0007-cok-saglayici-llm.md`, ADR 0003'ü süpersede eder).

### Fixed
- LLM istemcisine timeout (25s) + düşük retry eklendi: yavaş veya rate-limitli (429) bir
  model artık capture'ı ~60s askıda bırakmıyor; çıkarım zarifçe Tier-1'e/manuel'e düşer,
  enrich atlanır.

### Planned
- Tier-2 (Playwright JS-render) çıkarım — JS ile yüklenen fiyatlı sitelerin otomatik takibi
- Birim/entegrasyon/E2E test paketi (Vitest + Playwright)

## [0.1.0] - 2026-06-19

İlk sürüm — Faz 1 (yakala → çıkar → grupla → karşılaştır).

### Added
- Üç yakalama akışı: MV3 tarayıcı eklentisi, Telegram botu, PWA link-yapıştırma formu
- Katmanlı çıkarım pipeline'ı: Tier1 Open Graph / schema.org → Tier3 Claude fallback
  (`lib/extractor.ts`)
- Async zenginleştirme: AI kategori + spec + tag, Haiku (`lib/enrich.ts`)
- Grup-içi AI karşılaştırma: özellik tablosu + 0-100 skor + "önde olan" önerisi,
  talep anında ve cache'li, Sonnet (`lib/compare.ts`, `ComparisonCache`)
- Kategoriye göre otomatik gruplama (kova) ve manuel düzeltme
- Durum yönetimi: aday / alındı / elenen + notlar
- Tek-kullanıcı kimlik doğrulama: API anahtarı (eklenti/bot) + cookie passphrase (PWA)
- Prisma + PostgreSQL veri katmanı (`Product`, `Bucket`, `PriceCheck`, `ComparisonCache`)
- PWA manifest (mobilde "Ana ekrana ekle")
- Proje dokümantasyonu: PRD, requirements, sistem mimarisi, 6 ADR, test stratejisi,
  Vercel dağıtım kılavuzu

### Notes
- Scraping best-effort: anti-bot / JS-ağır sitelerde fiyat eksik kalabilir; elle düzeltme
  ile telafi edilir (bkz. `docs/adr/0004-katmanli-cikarim.md`).
- Tier 2 (Playwright JS-render) bilinçli olarak ertelendi.

[Unreleased]: https://example.com/decido/compare/v0.1.0...HEAD
[0.1.0]: https://example.com/decido/releases/tag/v0.1.0
