# ADR 0002: Veri Katmanı Olarak Prisma + PostgreSQL

**Tarih:** 2026-06-19
**Durum:** Kabul Edildi

## Bağlam

DECIDO yakalanan ürünleri, AI zenginleştirmesini (kategori/spec/tag), karşılaştırma
cache'ini ve (Faz 2) fiyat geçmişini kalıcı tutmalı. URL bazlı dedup, kategoriye göre
gruplama ve durum filtreleri için yapılandırılmış sorgular gerekiyor. "Her şey" ürün
havuzu olduğundan `specs`/`tags` alanları şemaya sığmayan, kategoriye göre değişen serbest
veridir.

Değerlendirilen alternatifler:
1. SQLite (yerel dosya) — kurulumu en kolay ama bulut/çok-cihaz erişimi ve eşzamanlılık zayıf.
2. Doküman DB (Mongo) — esnek ama dedup/ilişki/gruplama sorguları için fazladan yük.
3. **PostgreSQL + Prisma ORM** — tip güvenli sorgular, ilişkiler, JSON alan desteği.

## Karar

Üretimde **PostgreSQL** (Vercel Marketplace üzerinden Neon/Supabase) ve erişim katmanı
olarak **Prisma** kullanılmasına karar verildi. `tags` ve `specs` alanları **Json** olarak
tutulur (taşınabilirlik: gerekirse yerel SQLite'a sorunsuz geçiş). Enum yerine doğrulanan
**String** alanlar (`status`, `source`, `extractionTier`) tercih edildi (taşınabilirlik +
basitlik). Hot-reload'da çoklu client'ı önlemek için global singleton (`lib/prisma.ts`).

## Sonuçlar

* **Olumlu Etkiler:**
    * `url @unique` ile veritabanı seviyesinde dedup; `category`/`status` indeksleriyle hızlı gruplama/filtre.
    * Prisma'nın tip üretimi UI'a kadar tip güvenliği sağlar (`ProductDTO` serileştirmesi).
    * Json alanlar "her şey" havuzunun değişken spec yapısını şemayı bozmadan taşır.
* **Olumsuz Etkiler / Ödünleşimler:**
    * Yerel geliştirme bir Postgres bağlantısı (veya SQLite'a geçiş) gerektirir — sıfır-kurulum değil.
    * Json alanlar şema seviyesinde tip güvenliği vermez; DTO sınırında elle cast edilir.
