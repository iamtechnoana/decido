# DECIDO — Gereksinimler Belgesi (SRS)

**Sürüm:** 0.1.0 · **Tarih:** 2026-06-19

Bu belge DECIDO'nun fonksiyonel ve fonksiyonel olmayan gereksinimlerini teknik düzeyde
tanımlar. Ürün vizyonu ve KPI'lar için bkz. [PRD.md](./PRD.md).

## 1. Amaç ve Kapsam

Tek kullanıcılık bir "stratejik alışveriş" karar asistanı. Ürün linklerini yakalar, çıkarır,
gruplar ve grup içinde AI ile karşılaştırır. Kapsam: Faz 1 (yakala/çıkar/grupla/karşılaştır).
Fiyat takibi Faz 2'ye ertelendi.

## 2. Fonksiyonel Gereksinimler

| ID | Gereksinim | Kabul Ölçütü |
|----|-----------|--------------|
| FR-1 | Üç kanaldan link yakalama (eklenti, Telegram, PWA form) | Her kanaldan gönderilen geçerli URL bir `Product` kaydı oluşturur |
| FR-2 | URL normalize + dedup | Takip parametreleri atılır; aynı URL ikinci kez eklenince yeni kayıt oluşmaz |
| FR-3 | Katmanlı çıkarım | Tier1 (OG/schema) → eksikse Tier3 (LLM); `extractionTier` kayıtta tutulur |
| FR-4 | Manuel düzeltme | Kullanıcı title/price/currency/category/notes/targetPrice düzenleyebilir |
| FR-5 | Async zenginleştirme | Kayıt sonrası kategori/spec/tag dolar; hata kaydı düşürmez |
| FR-6 | Kategoriye göre gruplama | Aynı `category` ürünleri tek kovada listelenir |
| FR-7 | Grup-içi karşılaştırma | ≥2 üründe tablo + skor + öneri üretir; cache'lenir; `force` ile yenilenir |
| FR-8 | Durum yönetimi | aday/alındı/elenen geçişleri ve geri alma |
| FR-9 | Tek-kullanıcı erişim | Makineler API anahtarı, PWA passphrase cookie ile yetkilenir |

## 3. Fonksiyonel Olmayan Gereksinimler

| ID | Kategori | Gereksinim |
|----|----------|-----------|
| NFR-1 | Gizlilik | Tüm okuma/yazma uç noktaları yetki ister; secret'lar `.env`'de, asla commit edilmez |
| NFR-2 | Maliyet | Enrich = Haiku (item başına); karşılaştırma = Sonnet (talep anında + cache) |
| NFR-3 | Dayanıklılık | Çıkarım/enrich/karşılaştırma hataları zarifçe yutulur; UI çalışır kalır |
| NFR-4 | Performans | Yakalama yanıtı çıkarımı bekler ama enrich'i beklemez; kayıt anında görünür |
| NFR-5 | Taşınabilirlik | `tags`/`specs` Json → Postgres ve SQLite arasında geçiş mümkün |
| NFR-6 | Kurulabilirlik | PWA manifest + standalone display ile "Ana ekrana ekle" |

## 4. Bağımlılıklar

* Anthropic Claude API (enrich + karşılaştırma)
* PostgreSQL (Neon/Supabase) veya yerel SQLite
* Telegram Bot API (mobil yakalama)
* Vercel (dağıtım)

## 5. Kısıtlamalar

* Scraping best-effort; rastgele sitelerde %100 kapsama garanti edilmez.
* Faz 1 fiyat takibi/alarm içermez.
* Tek dil (TR), tek kullanıcı.

## 6. İzlenebilirlik

Mimari kararlar `docs/adr/` altında; test doğrulaması `docs/qa/test-strategy.md`'de;
dağıtım `docs/deployment/vercel.md`'de tanımlıdır.
