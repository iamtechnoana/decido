# Bertalanffy Labs — DECIDO Katkı Rehberi

DECIDO kişisel/tek-kullanıcılık bir üründür; bu rehber **kendi geliştirme disiplinimizi**
tanımlar (ekip değil, tutarlılık için). Kurulum adımları için [README.md](./README.md).

> **ÖNEMLİ:** `.env` dosyasını veya API anahtarlarını asla commit'leme. `.gitignore` `.env`'i
> dışlar; tüm secret'lar yalnız `.env`'de tutulur.

## 1. Dal (Branch) İsimlendirme

Çalışmaları her zaman `master`'dan yeni bir dalda yap:
- `feat/ozellik-adi` — yeni özellik (MINOR sürüm artışı)
- `fix/hata-adi` — hata düzeltmesi (PATCH artışı)
- `docs/belge-adi` — yalnız dokümantasyon
- `refactor/modul-adi` — davranışı değiştirmeyen iyileştirme

## 2. Commit Mesajı Standartları (Conventional Commits)

Mesajlar SemVer'e eşlenir; CHANGELOG insanlar içindir, aynı tür değişiklikler gruplanır:
- `feat: telegram yakalamaya çoklu link desteği` → MINOR
- `fix: TR fiyat ayrıştırmada ondalık hatası` → PATCH
- `BREAKING CHANGE: capture endpoint sözleşmesi değişti` → MAJOR

## 3. Pull Request / Birleştirme Süreci

Birleştirmeden önce:
1. `npx eslint .` ve `npm run build` yerel olarak hatasız geçmeli.
2. Yeni bir API uç noktası eklediysen `docs/`'u güncelle.
3. Kullanıcıya dönük önemli değişiklikte `CHANGELOG.md`'nin `[Unreleased]` bölümünü güncelle.
4. Sürüm çıkarken `[Unreleased]` girişlerini yeni bir sürüm bölümüne taşı + git tag (`vX.Y.Z`).

## 4. Mimari Kararlar (ADR)

Sistemin çalışma mantığını etkileyen büyük değişikliklerden önce `docs/adr/` altına yeni,
numaralı bir ADR (Nygard formatı: Bağlam / Karar / Sonuçlar) ekle. Kabul edilmiş ADR'ler
değiştirilmez; yerine `Superseded` durumuyla yenisi yazılır.

## 5. Kod Standartları

- TypeScript `strict`; ESLint hatasız.
- Dosyaları odaklı ve küçük tut (tek sorumluluk — bkz. `lib/` katmanları).
- Mevcut desenleri izle; çevredeki kodun stiline uy.
