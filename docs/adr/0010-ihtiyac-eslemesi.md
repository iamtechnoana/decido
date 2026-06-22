# ADR 0010: İhtiyaç Eşleme (Need Mapping) — Dürtü Farkındalığı

**Tarih:** 2026-06-20
**Durum:** Kabul Edildi

## Bağlam

Karar yorgunluğunun çoğu, aslında ihtiyaç olmayan şeyler için harcanan enerjiden gelir. Kullanıcı
bir ürün eklerken, kendi geçmişiyle ilgili bir farkındalık işe yarar: "Bu kategoride zaten 3
ürünün var", "Son 6 ayda 4 kulaklık aldın — desen mi?", "Şuna çok benziyor". Amaç dürtüsel alımı
**engellemek değil, görünür kılmak**.

## Karar

`computeNeedSignal(id)` ([lib/needmap.ts](../../lib/needmap.ts)) — enrich kategoriyi belirledikten
sonra arka planda (capture boru hattının 3. adımı) çalışır ve `Product.needSignal` (Json) yazar:
- `sameCategoryCount`: aynı kategoride arşivlenmemiş diğer ürün sayısı.
- `recentBuys` / `recentSpend`: son 6 ayda aynı kategoride `bought` sayısı + toplam fiyat
  (zaman ölçütü `updatedAt` proxy — ayrı `boughtAt` alanı yok, MVP).
- `similar`: aynı kategoride başlık-token **Jaccard ≥ 0.4** olan en benzer ürün (embedding YOK).

UI'da inbox kartında sarı bilgi kutusu: bloke etmez, yalnız bilgilendirir.

## Sonuçlar

* **Olumlu:**
    * Kullanıcının kendi davranış deseni anında görünür — dürtüsel alıma karşı en güçlü kaldıraç.
    * Ek altyapı yok: yalnız yerel veri + basit string benzerliği; maliyetsiz, hızlı.
* **Olumsuz / Ödünleşim:**
    * Benzerlik kabası (token Jaccard) — "iPhone 15" vs "iPhone 15 Pro" yakalanır ama anlamsal
      eşler (eş anlamlı/farklı dil) kaçabilir. Embedding tabanlı benzerlik sonraki faz.
    * `recentBuys` zamanı `updatedAt` ile tahmini (ayrı satın-alma tarihi yok).
    * needSignal capture anında bir kez hesaplanır; sonradan eklenen ürünler eski sinyalleri
      güncellemez (yeniden hesap gerekirse manuel/periyodik tetik eklenebilir).
