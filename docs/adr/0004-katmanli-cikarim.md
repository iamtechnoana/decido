# ADR 0004: Katmanlı (Best-Effort) Ürün Çıkarımı

**Tarih:** 2026-06-19
**Durum:** Kabul Edildi

## Bağlam

"Her şey" ürün havuzunda siteler tutarsız yapıdadır. Bir URL'den başlık/görsel/fiyat
güvenilir biçimde çıkarmak gerekir, ama anti-bot korumaları ve JS ile yüklenen fiyatlar
tek bir yöntemi kırılgan kılar. Tek kullanıcılık üründe ağır altyapı (her capture'da
headless tarayıcı) maliyet/karmaşıklık açısından orantısız olur.

Değerlendirilen alternatifler:
1. Sadece jenerik meta (OG/schema.org) — hızlı ama JS-ağır sitelerde fiyat eksik.
2. Her zaman headless render (Playwright) — kapsayıcı ama yavaş, pahalı, Vercel'de zahmetli.
3. Her zaman LLM — esnek ama her capture'da maliyet.
4. **Katmanlı: ucuzdan pahalıya kademeli geçiş.**

## Karar

**Katmanlı best-effort çıkarım** (`lib/extractor.ts`):
* **Tier 1 — Jenerik meta:** Sunucu tarafı `fetch` + cheerio ile Open Graph + schema.org
  JSON-LD `Product`. Çoğu e-ticaret sitesini kapsar.
* **Tier 3 — LLM fallback:** Tier 1 eksikse, temizlenmiş sayfa metni Claude'a verilip
  yapılandırılmış alanlar çıkarılır.
* **Tier 2 — JS render (Playwright):** MVP'de **devre dışı**. Çoğu site verisi HTML'de
  mevcut olduğundan Tier 1+3 yeterli kapsama sağlar; gerekirse sonradan eklenir.
* **Manuel düzeltme:** Her alan UI'da düzenlenebilir; düzeltilen kayıt `extractionTier=manual`.

## Sonuçlar

* **Olumlu Etkiler:**
    * Hızlı ve ucuz yol (Tier 1) çoğu durumu karşılar; LLM yalnız gerektiğinde devreye girer.
    * Hangi tier ile çıkarıldığı (`extractionTier`) kayıtta izlenir; başarısızlık zarif şekilde elle düzeltmeye düşer.
* **Olumsuz Etkiler / Ödünleşimler:**
    * %100 otomasyon vaat edilmez; bazı sitelerde (ör. canlı testte Allbirds) fiyat eksik kalabilir.
    * Tier 2'nin yokluğu, verisi yalnız JS ile gelen nadir siteleri Tier 3'e (veya manuel'e) bırakır.
