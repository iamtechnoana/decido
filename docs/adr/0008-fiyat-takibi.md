# ADR 0008: Fiyat Takibi ve Alarm Mimarisi (Faz 2)

**Tarih:** 2026-06-20
**Durum:** Kabul Edildi

## Bağlam

Faz 2 "vakti geldiğinde al" sözünü somutlaştırır: kullanıcı bir ürüne hedef fiyat koyar,
sistem periyodik olarak fiyatı yeniden çeker ve hedefe inince veya yeni bir dip görülünce
haber verir. Karar gerektiren noktalar: (1) fiyat yeniden çekme yöntemi/maliyeti, (2)
zamanlama, (3) alarm kanalı, (4) tetikleme koşulu.

Değerlendirilen alternatifler:
* Yeniden çekme: tam pipeline (doğru ama her kontrolde LLM maliyeti) vs **sadece Tier-1**
  (ucuz, LLM yok) vs Tier-1+LLM fallback.
* Zamanlama: yerel scheduler vs **Vercel Cron** (üretim) + manuel tetik (yerel).
* Alarm: sadece Telegram vs sadece uygulama-içi vs **ikisi**.
* Tetik: sadece hedef fiyat vs **hedef + yeni en-düşük** vs hedef + yüzde düşüş.

## Karar

* **Yeniden çekme = sadece Tier-1** (`extractPriceOnly`, OG/schema.org; LLM yok). Periyodik
  çalıştığı için maliyetsiz/hızlı olmalı; JS-fiyatlı siteler otomatik güncellenmez (kullanıcı
  elle günceller). Bilinçli ödünleşim.
* **Zamanlama = Vercel Cron** (`vercel.json`, günlük) üretimde; yerelde UI'daki "Fiyatları
  kontrol et" butonu manuel tetikler. Endpoint `/api/price-check` üç yetkiyi kabul eder:
  Cron secret · API anahtarı · giriş yapmış oturum.
* **Alarm = uygulama-içi + Telegram.** Uygulama-içi sinyal (🎯 hedefte / ⬇ en düşük) her
  zaman türetilir (depolama gerektirmez); Telegram kuruluysa `notifyOwner` push gönderir,
  değilse sessizce atlanır.
* **Tetik = hedef fiyat çaprazı VEYA yeni en-düşük.** Hedef alarmı yalnız fiyat hedefin
  üstündeyken altına *inince* (tek seferlik); en-düşük alarmı yalnız gerçek dip kırılınca.
  `lastAlertedAt` spam'i sınırlar.

## Sonuçlar

* **Olumlu Etkiler:**
    * Periyodik kontrol maliyetsiz (Tier-1); LLM yalnız ilk yakalamada kullanılır.
    * Çapraz/dip bazlı tetik doğal throttle sağlar — fiyat sabit kalırsa tekrar tekrar alarm çalmaz.
    * Telegram opsiyonel: kurulum olmadan uygulama-içi sinyal çalışır.
    * `PriceCheck` geçmişi sparkline (fiyat trendi) için veri sağlar.
* **Olumsuz Etkiler / Ödünleşimler:**
    * JS ile yüklenen fiyatlı siteler otomatik takip edilemez (Tier-1 sınırı) — kullanıcı elle güncelleyebilir.
    * Vercel Cron yalnız üretimde; yerelde manuel tetik gerekir.
    * Yalnız `alertEnabled` + `status=candidate` ürünler kontrol edilir (yük sınırı).
