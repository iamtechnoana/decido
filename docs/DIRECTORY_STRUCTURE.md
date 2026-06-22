# DECIDO — Klasör/Dosya Ağacı Yapısı

**Sürüm:** 0.1.0 · **Tarih:** 2026-06-19

Bertalanffy Labs dokümantasyon disiplinine uygun, **Next.js'e uyarlanmış** depo düzeni
(`src/` yerine `app/`; `requirements.txt` yerine `package.json`; Docker yok — Vercel-native).

```
decido/
├── docs/                           # 📚 Proje dokümantasyonu
│   ├── adr/                        # Mimari Karar Kayıtları (Nygard)
│   │   ├── 0001-nextjs-typescript-stack.md
│   │   ├── 0002-prisma-postgres.md
│   │   ├── 0003-anthropic-sdk-dogrudan.md
│   │   ├── 0004-katmanli-cikarim.md
│   │   ├── 0005-tek-kullanici-auth.md
│   │   ├── 0006-on-demand-cache-karsilastirma.md
│   │   ├── 0007-cok-saglayici-llm.md
│   │   ├── 0008-fiyat-takibi.md
│   │   ├── 0009-inbox-yasam-dongusu.md
│   │   ├── 0010-ihtiyac-eslemesi.md
│   │   └── 0011-tldr-ozet.md
│   ├── architecture/
│   │   └── system-design.md        # Hafif SAD (katmanlar, akış, güvenlik)
│   ├── deployment/
│   │   └── vercel.md               # Vercel-native dağıtım + rollback
│   ├── qa/
│   │   └── test-strategy.md        # Test piramidi + statik analiz (TS araçları)
│   ├── PRD.md                      # Ürün gereksinimleri (vizyon, KPI)
│   ├── requirements.md             # Fonksiyonel/fonksiyonel olmayan gereksinimler (SRS)
│   └── DIRECTORY_STRUCTURE.md      # Bu dosya
│
├── app/                            # 💻 Next.js App Router
│   ├── api/                        # Sunucu uç noktaları
│   │   ├── capture/route.ts        # ana yakalama
│   │   ├── telegram/route.ts       # bot webhook
│   │   ├── compare/route.ts        # grup-içi karşılaştırma (on-demand)
│   │   ├── price-check/route.ts    # periyodik fiyat kontrolü (cron/api-key/oturum)
│   │   ├── maintenance/route.ts    # TTL süpürme (cron/api-key/oturum)
│   │   ├── products/route.ts       # liste
│   │   ├── products/[id]/route.ts  # güncelle/sil
│   │   └── login/route.ts          # passphrase girişi
│   ├── login/page.tsx              # giriş ekranı
│   ├── page.tsx                    # ana sayfa (server: auth + liste)
│   ├── layout.tsx                  # kök layout (html/body, PWA meta)
│   ├── manifest.ts                 # PWA manifest
│   └── globals.css                 # Tailwind 4 tema
│
├── components/                     # İstemci bileşenleri
│   ├── Board.tsx                   # ana pano (kovalar, yakalama, filtre, fiyat kontrol)
│   ├── ProductCard.tsx             # sinyal (🎯/⬇) + sparkline
│   ├── ComparePanel.tsx
│   ├── Sparkline.tsx               # fiyat geçmişi grafiği
│   └── EditModal.tsx               # düzenle + hedef fiyat + alarm aç/kapa
│
├── lib/                            # Çekirdek mantık (tek sorumluluk)
│   ├── ai.ts                       # Anthropic client + JSON ayıklama
│   ├── prisma.ts                   # Prisma singleton
│   ├── auth.ts                     # API anahtarı + cookie passphrase
│   ├── extractor.ts                # Tier1 OG/schema → Tier3 LLM
│   ├── enrich.ts                   # kategori/spec/tag
│   ├── compare.ts                  # grup-içi karşılaştırma + cache
│   ├── capture.ts                  # dedup→çıkar→kaydet→async enrich
│   ├── pricecheck.ts               # periyodik fiyat çek + alarm (Faz 2)
│   ├── summary.ts                  # TL;DR özet — artı/eksi/fark/ideal (Faz 4)
│   ├── needmap.ts                  # İhtiyaç Eşleme — dürtü farkındalığı (Faz 3)
│   ├── maintenance.ts              # TTL süpürme (Faz 3)
│   ├── constants.ts                # TTL/sabitler
│   ├── telegram.ts                 # notifyOwner / sendTelegramTo
│   ├── serialize.ts                # Prisma satırı → ProductDTO
│   └── types.ts                    # paylaşılan DTO'lar
│
├── prisma/
│   └── schema.prisma               # Product, Bucket, PriceCheck, ComparisonCache
│
├── extension/                      # MV3 tarayıcı eklentisi
│   ├── manifest.json
│   ├── popup.html
│   └── popup.js
│
├── public/
│   └── icon.svg
│
├── .env.example                    # Örnek ortam değişkenleri
├── .gitignore
├── CHANGELOG.md                    # Sürümler arası değişiklikler (Keep a Changelog)
├── CONTRIBUTING.md                 # Dal/commit/PR disiplini
├── LICENSE                         # Tescilli (Bertalanffy Labs)
├── CLAUDE.md                       # Proje el kitabı (önce okunur)
├── README.md                       # Vitrin + kurulum
├── package.json
├── next.config.ts                  # turbopack.root + uzak görseller
├── vercel.json                     # Vercel Cron (günlük fiyat kontrolü)
├── tsconfig.json
├── postcss.config.mjs
└── eslint.config.mjs
```

## Neden Bu Yapı?

* **Sınırlar net:** UI (`app/` + `components/`), mantık (`lib/`), veri (`prisma/`), belgeler
  (`docs/`) birbirine karışmaz.
* **Güvenlik yerleşik:** `.env` repoda değil; `.env.example` doldurulur.
* **Sürdürülebilirlik:** `CHANGELOG.md` + SemVer + `docs/adr/` kararların hafızasını tutar.
* **Next.js gerçeği:** `app/` router; ayrı backend/Docker yok — Vercel-native (ADR 0001).
