# ADR 0001: Uygulama Yığını Olarak Next.js 16 + TypeScript

**Tarih:** 2026-06-19
**Durum:** Kabul Edildi

## Bağlam

DECIDO; üç yakalama akışı (tarayıcı eklentisi, Telegram botu, PWA formu), sunucu tarafı
çıkarım pipeline'ı, bir veritabanı ve bir web arayüzünü tek üründe birleştirmeli. Tek
kullanıcılık kişisel bir ürün olsa da ileride ürünleşebilecek IP olarak `build/products/`
altında tutuluyor. Mobil yakalama ve her yerden erişim gerektiğinden bulut tabanlı,
kurulumu kolay, mevcut workspace stack'iyle uyumlu bir çatı gerekiyordu.

Değerlendirilen alternatifler:
1. Ayrı frontend (React/Vite) + ayrı backend (FastAPI/Express) — iki dağıtım, iki dil.
2. Tam yerel (Electron/masaüstü) — mobil yakalama ve "paylaş" akışını zedeliyor.
3. **Next.js (App Router) tek uygulama** — UI + API route'ları + sunucu işlevleri tek yerde.

Workspace standardı zaten Next.js 16 + React 19 + Tailwind 4 (`build/products/bertalanffylabs`)
ve Vercel Pro hesabı mevcut.

## Karar

Tek bir **Next.js 16 (App Router) + TypeScript** uygulaması kullanılmasına karar verildi:
UI (React 19 + Tailwind 4) ve backend (API route'ları) aynı kod tabanında. Sürüm kilidi
`bertalanffylabs` ile aynı tutuldu (next 16.2.2). i18n (next-intl) **dahil edilmedi** —
DECIDO tek dilli (TR) kişisel üründür.

## Sonuçlar

* **Olumlu Etkiler:**
    * Tek dağıtım hedefi (Vercel), tek dil (TypeScript), paylaşılan tip katmanı (`lib/types.ts`).
    * Mevcut `bertalanffylabs` config'i (tsconfig, postcss, eslint, Tailwind 4) birebir referans alındı → kurulum riski düştü.
    * API route'ları çıkarım/LLM çağrılarını sunucuda tutar; API anahtarları istemciye sızmaz.
* **Olumsuz Etkiler / Ödünleşimler:**
    * Next.js 16 eğitim verisinden farklı kırıcı değişiklikler içerir; config hafızadan değil çalışan referanstan üretildi.
    * Tek-kod-tabanı, ileride mobil-native bir istemci gerekirse API'yi ayrıştırmayı gerektirebilir (şimdilik YAGNI).
