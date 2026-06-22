# DECIDO — Ürün Gereksinimleri Belgesi (PRD)

**Sürüm:** 0.1.0 · **Tarih:** 2026-06-19 · **Durum:** Faz 1 tamamlandı

## 1. Asansör Konuşması

İnternette gezerken beğendiğin ürünleri anında yakala; DECIDO onları otomatik çıkarır,
kategoriye göre gruplar, grup içinde AI ile karşılaştırıp puanlar ve doğru zamanda almana
yardım eder. **Dağınık linkler → yapılandırılmış karar.**

## 2. Problem

Kullanıcı gezerken beğendiği ürün linklerini farklı yerlere kaydediyor (mesajlar, sekmeler,
not uygulamaları). Sonra aralarında seçim yaparken: linkler dağınık, karşılaştırma manuel,
"şimdi mi almalı" sorusunu takip eden bir mekanizma yok. Sonuç: ya aceleyle alıyor ya da
karar veremeyip unutuyor.

## 3. Hedef Kitle

Tek kullanıcı (kişisel ürün). "Stratejik alıcı": araştırıp karşılaştırarak, doğru zamanda
almak isteyen; çok sayıda aday biriktiren biri. Kategori sabit değil — "her şey" havuzu.

## 4. Temel İlke

Kategoriler arası kıyas anlamsızdır. Değer **grup içi** seçimdedir. Akış:
**yakala → çıkar → grupla → karşılaştır → (Faz 2) alım anında haber ver.**

## 5. İşlevsel Gereksinimler (Faz 1 — tamamlandı)

* **Y-1 Yakalama (3 yol):** tarayıcı eklentisi · Telegram botu · PWA'da link yapıştırma.
  URL normalize + dedup.
* **C-1 Çıkarım:** başlık/görsel/fiyat/açıklama otomatik (katmanlı, best-effort);
  her alan elle düzeltilebilir.
* **Z-1 Zenginleştirme:** AI kategori + spec + tag (async, kaydı bloke etmez).
* **G-1 Gruplama:** AI kategorisine göre otomatik kovalar; kullanıcı manuel kovaya taşıyabilir.
* **K-1 Karşılaştırma:** kova içinde özellik tablosu + 0-100 skor + "önde olan" önerisi
  (talep anında, cache'li).
* **D-1 Durum:** aday / alındı / elenen + serbest not.

## 6. İşlevsel Olmayan Gereksinimler

* **Gizlilik:** kişisel veri yetkisiz erişime kapalı (tek-kullanıcı auth); secret'lar yalnız `.env`.
* **Maliyet:** LLM kullanımı düşük tutulur (enrich = Haiku item başına; karşılaştırma =
  Sonnet yalnız talep anında + cache).
* **Dayanıklılık:** çıkarım/enrich hatası kaydı düşürmez (graceful degradation); kullanıcı düzeltir.
* **Erişim:** PWA, mobilde "Ana ekrana ekle" ile kurulabilir.

## 7. Kapsam ve Kısıtlamalar

* **Kapsam dışı (Faz 1):** fiyat takibi/alarm (Faz 2'ye ertelendi); çok kullanıcı; öneri
  geçmişi/analitik.
* **Bilinen sınır:** scraping best-effort — anti-bot / JS-ağır sitelerde fiyat eksik kalabilir.

## 8. Başarı Ölçütleri

* Bir link 5 saniyeden kısa sürede yakalanıp listede görünür (çıkarım async tamamlanır).
* Aynı kategoriden ≥2 aday otomatik aynı kovaya düşer.
* Bir kova açıldığında AI karşılaştırma tablosu + skor + öneri üretilir; ikinci açılış cache'ten gelir.
* Kullanıcı, biriktirdiği adaylar arasından grup içi karşılaştırmaya bakarak bir seçim yapabilir.

## 9. Faz 2 — Fiyat takibi (tamamlandı, 2026-06-20)

- **F-1 Hedef fiyat + alarm:** ürüne hedef fiyat + alarm aç; periyodik Tier-1 fiyat kontrolü
  (`/api/price-check`, Vercel Cron / manuel buton).
- **F-2 Tetik:** hedefin altına *inince* veya yeni en-düşük görülünce → uygulama-içi sinyal
  (🎯/⬇) + Telegram bildirimi (kuruluysa).
- **F-3 Fiyat geçmişi:** `PriceCheck` kayıtları → ProductCard'da sparkline.

Sınır: yeniden çekme sadece Tier-1 (LLM'siz, ucuz); JS-fiyatlı siteler elle güncellenir
(bkz. `docs/adr/0008-fiyat-takibi.md`).

## 10. Faz 3 — Birikim & Yaşam Döngüsü (tamamlandı, 2026-06-20)

DECIDO'nun yeni ekseni: **karar yorgunluğunu ve dürtüsel alımı azaltmak.**
- **B-1 Anında + Inbox-önce yakalama:** tek tık ~300ms; her kayıt "İncelenmemiş"e düşer,
  detaylar arka planda dolar.
- **B-2 TTL/ömür:** 30 günlük ömür; süresi dolan inbox öğeleri otomatik arşivlenir (geri alınabilir);
  Uzat.
- **B-3 Görsel Eriyik:** arşiv + Geri al + Tamamen sil.
- **B-4 İhtiyaç Eşleme:** kendi geçmişinden desen uyarısı ("bu kategoride N ürün / son 6 ayda N alım /
  şuna benziyor") — bloke etmez.

## 11. Faz 4 — TL;DR Özet Kartları (tamamlandı, 2026-06-20)

Her ürün için "3 saniyelik özet" (🟢 artı · 🔴 eksi · ⚡ fark · 🎯 ideal kullanıcı), arka planda
güçlü modelle üretilir, "AI özeti" etiketli. Kullanıcı yorum/video/doküman taramadan karar verir.
Kaynak: sayfa metni + model bilgisi (web-arama Faz 6).

## 12. Roadmap

- **Faz 5 (C):** swipe eleme · Seyir↔Karar modları · Seçme Asistanı (Anket/Battle/"Bana karar ettir")
  · akıllı öbekleme.
- **Faz 6:** Tier-2 (Playwright) otomatik fiyat takibi; web-arama destekli özet; zamanlanmış nudge'lar;
  otomatik test paketi.
