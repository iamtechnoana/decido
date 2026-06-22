# DECIDO — Test ve Kalite Güvencesi Stratejisi

**Sürüm:** 0.1.0 · **Tarih:** 2026-06-19

Bu belge DECIDO'nun doğrulanması için test yöntemlerini ve kod kalite standartlarını tanımlar.
Stack TypeScript/Next.js olduğundan araçlar buna göre uyarlanmıştır (Python değil).

## 1. Kod Kalite Standartları (Statik Analiz)

Depoya gönderilen her kod aşağıdaki araçlarla denetlenir:

* **ESLint** (`eslint-config-next` + TypeScript) — `npx eslint .` hatasız geçmeli. Hata veren
  kod PR'da reddedilir. (Mevcut durum: 0 hata.)
* **TypeScript** — `strict: true`. `next build` içindeki tip kontrolü hatasız geçmeli.
* **Prettier benzeri biçim** — proje stiline uygun, tutarlı biçim (2 boşluk, tek tırnak).

Hedef: her commit öncesi `npx eslint .` ve `npm run build` yerel olarak çalıştırılır.

## 2. Test Piramidi

### A. Birim Testleri (Unit)
* **Araç:** Vitest (öneri) veya Node test runner.
* **Odak (dış sisteme bağlanmadan):**
  * `lib/extractor.ts` — `parsePrice` (TR/US biçimleri), `fromOpenGraph`/`fromJsonLd`
    fixture HTML üzerinde, `normalizeUrl` (takip parametresi atma), `domainOf`.
  * `lib/capture.ts` — `firstUrl`, `normalizeUrl`.
* **Hedef:** çıkarım/normalize yardımcılarında yüksek kapsam (en kırılgan, saf mantık).
* **Not:** Tier-1 çıkarım hâlihazırda bir fixture testiyle doğrulandı (TR fiyat dahil geçti).

### B. Entegrasyon Testleri
* **Kapsam:** API route'ları + Prisma. Gerçek `.env` yerine `.env.test` (izole DB:
  yerel SQLite veya ayrı test şeması).
* **Senaryolar:** `/api/capture` dedup (aynı URL ikinci kez → yeni kayıt yok); `/api/login`
  doğru/yanlış parola; `/api/products/[id]` yalnız izinli alanları günceller.
* **LLM:** enrich/compare çağrıları mock'lanır (deterministik, maliyetsiz).

### C. Uçtan Uca Testler (E2E)
* **Araç:** Playwright.
* **Akış:** giriş → link yapıştır → kayıt listede belirir → kategori dolar → kova açılır →
  karşılaştırma tablosu render olur.
* **Smoke (mevcut):** dev sunucusu doğrulandı — `/login` 200, yanlış parola 401, doğru
  parola 200+cookie, yetkisiz `/api/capture` 401, manifest 200.

## 3. Sürekli Test Otomasyonu (CI)

GitHub Actions (veya Vercel CI): `push`/PR'da `eslint` → `tsc`/`build` → unit → integration.
Geçemeyen kod `main`/`master` dalına birleştirilemez. LLM'e bağlı testler mock ile çalışır
(CI'da API anahtarı gerektirmez).

## 4. Manuel Doğrulama (sürüm öncesi)

Gerçek `.env` ile (ANTHROPIC_API_KEY + DATABASE_URL): 3 farklı kategoriden gerçek URL yakala
→ çıkarım/kategori/karşılaştırmayı gözle doğrula. Bilinen sınır: scraping best-effort
(bkz. ADR 0004) — bazı sitelerde fiyat eksik olabilir, elle düzeltilir.
