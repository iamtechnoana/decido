# ADR 0009: Inbox-Önce Yaşam Döngüsü, Anında Yakalama ve TTL (Faz 3)

**Tarih:** 2026-06-20
**Durum:** Kabul Edildi

## Bağlam

DECIDO, "ürün karşılaştırma"dan **karar yorgunluğunu azaltan biriktirme + eleme sistemine**
evriliyor. İki sorun: (1) yakalama "hissettirmeden" olmalı — mevcut akış çıkarımı (LLM dahil
~25sn) bloke ediyordu; (2) biriken ama incelenmeyen şeyler zihinsel yük yaratıyor.

## Karar

- **Inbox-önce durum makinesi:** `status` = `inbox` (İncelenmemiş, varsayılan) → `candidate`
  (tutulan) → `bought`; her aşamadan `archived` (Eriyik, soft-delete). Eski `dismissed` kaldırıldı.
- **Anında yakalama:** `captureUrl` kaydı **hemen** oluşturur (inbox + `expiresAt = now+30g`) ve
  döner; çıkarım+enrich+ihtiyaç-eşleme **`after()`** (next/server) ile response sonrası arka planda
  çalışır. `void` fire-and-forget yerine `after()`, Vercel'de güvenilir çalışır (Fluid Compute).
  Ölçülen yakalama yanıtı: ~**300ms** (önceki ~10-25sn).
- **TTL / ömür biçme:** kayda 30 günlük ömür. Günlük cron (`/api/maintenance`, `runTtlSweep`)
  süresi dolmuş **inbox** ürünleri otomatik **arşivler** (`archiveReason='ttl'`, yıkıcı değil).
  Kullanıcı "Uzat" (+14g) ile süreyi uzatır. Zamanlayıcı kullanıcının yerine karar verir.
- **Görsel Eriyik:** `archived` ürünler ayrı sekmede; "Geri al" (→inbox) ile süresiz kurtarılır;
  "Tamamen sil" kalıcı DELETE.
- Triaj yan etkileri route'ta: `candidate/bought` → `reviewedAt`; `archived` → `archivedAt`;
  `inbox`'a dönüş → arşiv izleri temizlenir.

## Sonuçlar

* **Olumlu:**
    * Kayıt zihinsel yükü sıfır — tek tık, gerisi arka planda; kullanıcı asla beklemez.
    * Birikim kendini yönetir: bakılmayan inbox öğeleri TTL ile sessizce arşive iner (geri alınabilir).
    * Durum makinesi sonraki fazlara (swipe, batch pencereleri) temel olur.
* **Olumsuz / Ödünleşim:**
    * `after()` arka plan işi Vercel'de Fluid Compute'a, yerelde dev sunucusuna bağlı; başarısızsa
      alanlar boş kalır (graceful — kayıt yine durur, elle düzeltilir).
    * Mevcut `dismissed` referansları (Board, compare, ProductCard) `archived`'a taşındı.
    * TTL otomatik arşivleme yıkıcı değil ama kullanıcı Eriyik'i hiç açmazsa birikir — kalıcı purge
      ayrı bir manuel aksiyon.
