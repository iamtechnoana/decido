# ADR 0005: Tek-Kullanıcı Basit Kimlik Doğrulama

**Tarih:** 2026-06-19
**Durum:** Kabul Edildi

## Bağlam

DECIDO tek kullanıcılık (kişisel) bir üründür. İki farklı erişim yüzeyi var: (1) makine
istemcileri — tarayıcı eklentisi ve Telegram botu `/api/capture`'a yazar; (2) insan —
PWA arayüzü. Çok kullanıcılı bir kimlik sistemi (NextAuth sağlayıcıları, kullanıcı tablosu,
roller) bu kapsam için aşırı mühendislik olur.

Değerlendirilen alternatifler:
1. Auth.js/NextAuth + OAuth sağlayıcı — çok kullanıcı için doğru, tek kullanıcı için fazla.
2. Hiç auth — kişisel veri (alışveriş listesi) herkese açık kalır, kabul edilemez.
3. **İki basit mekanizma:** makineler için paylaşılan API anahtarı, insan için cookie passphrase.

## Karar

**İki basit mekanizma** (`lib/auth.ts`):
* **Makine istemcileri:** `DECIDO_API_KEY` paylaşılan sırrı; `Authorization: Bearer` veya
  `X-Api-Key` header'ı ile doğrulanır (eklenti + Telegram webhook `?secret=`).
* **PWA:** tek `DECIDO_APP_PASSWORD` passphrase'i; doğruysa httpOnly cookie set edilir
  (1 yıl, kişisel kullanım). `/api/capture` ya API anahtarı ya da giriş yapmış oturumu kabul eder.

## Sonuçlar

* **Olumlu Etkiler:**
    * Minimum bağımlılık ve karmaşıklık; kişisel veriyi yetkisiz erişime kapatmak için yeterli.
    * Eklenti/bot ve PWA aynı `/api/capture` endpoint'ini paylaşır, iki ayrı yetki yolu temiz ayrışır.
* **Olumsuz Etkiler / Ödünleşimler:**
    * Çok kullanıcı / paylaşım gerekirse bu katman değiştirilmeli (şimdilik YAGNI).
    * Tek paylaşılan sır → sızarsa rotasyon gerekir; secret'lar yalnız `.env`'de tutulur, asla commit edilmez.
