# ADR 0006: Grup-İçi Karşılaştırmanın On-Demand + Cache'li Yapılması

**Tarih:** 2026-06-19
**Durum:** Kabul Edildi

## Bağlam

DECIDO'nun asıl zekâsı grup-içi karşılaştırmadır: aynı kategorideki adayların özellik
tablosu + 0-100 skor + "önde olan" önerisi. Bu, en güçlü (ve pahalı) model olan Sonnet'i
gerektirir. Her ürün eklendiğinde ya da her sayfa açılışında bunu hesaplamak hem maliyetli
hem gereksizdir; kullanıcı çoğu kovayı hiç açmayabilir.

Değerlendirilen alternatifler:
1. Capture anında her grup için önceden hesapla — çoğu hesap boşa gider, maliyet yüksek.
2. Her görüntülemede yeniden hesapla — tutarlı ama tekrar tekrar pahalı LLM çağrısı.
3. **Talep anında hesapla + içerik imzasına göre cache'le.**

## Karar

Karşılaştırma yalnızca kullanıcı bir kovayı açıp **"Karşılaştır"** dediğinde çalışır
(`/api/compare`, `lib/compare.ts`). Sonuç `ComparisonCache` tablosunda `groupKey`
(`category:<ad>` veya `bucket:<id>`) altında saklanır. Geçersizleştirme, gruptaki
ürünlerin `id + fiyat` imzasıyla yapılır: imza değişmedikçe cache döner, değişince yeniden
hesaplanır. Skorlar ilgili `Product` kayıtlarına geri yazılır (en iyi-çaba). Kullanıcı
"Yenile" ile zorla yeniden hesaplatabilir (`force`).

## Sonuçlar

* **Olumlu Etkiler:**
    * Pahalı model yalnız gerçekten istendiğinde çalışır; tekrar açılışlar cache'ten gelir → düşük maliyet, hızlı UX.
    * İçerik-imzası geçersizleştirme, fiyat/aday değişince otomatik tazeler; gereksiz yeniden hesap yapmaz.
* **Olumsuz Etkiler / Ödünleşimler:**
    * İlk karşılaştırma görece yavaştır (canlı LLM çağrısı) — kullanıcıya "AI karşılaştırıyor…" göstergesiyle iletilir.
    * Skorlar grup bağlamına özeldir; tek ürünün skoru ait olduğu kovaya göre anlamlıdır (kategoriler arası kıyaslanamaz).
