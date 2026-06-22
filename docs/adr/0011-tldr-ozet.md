# ADR 0011: TL;DR Özet Kartları (Faz 4)

**Tarih:** 2026-06-20
**Durum:** Kabul Edildi

## Bağlam

Kullanıcı bir ürüne karar verirken sayfa sayfa yorum okumak, video izlemek, teknik doküman
incelemek zorunda kalıyor. "3 saniyelik özet" (🟢 artılar · 🔴 eksiler · ⚡ fark · 🎯 ideal
kullanıcı) bu yükü kaldırır. Kritik karar: özet neye dayansın ve ne zaman/hangi modelle üretilsin.

## Karar

- **Kaynak = sayfa içeriği + AI bilgisi.** `extractProduct` artık tek geçişte temizlenmiş
  `pageText`'i (in-memory, DB'ye yazılmaz) döndürür; `generateTldr` bunu + modelin genel bilgisini
  kullanır. **Web arama dahil edilmedi** (ek API/maliyet) → sonraki faz. Dürüst etiketleme: UI'da
  "AI özeti" + tooltip "canlı yorum garantisi değil".
- **Üretim = ayrı arka plan çağrısı, güçlü model.** Capture boru hattının 3. adımı (extract→enrich
  →**tldr**→needmap), `after()` ile arka planda. Model `SUMMARY_MODEL` (verilmezse `COMPARE_MODEL`).
  Kullanıcıyı bloke etmez; başarısızsa `tldr` boş kalır (graceful), kart "özet hazırlanıyor…" gösterir.
- **Çift fetch yok:** `pageText` çıkarım sırasında zaten elde edilen HTML'den üretilir; özet için
  sayfa tekrar indirilmez.

## Sonuçlar

* **Olumlu:**
    * Karar süresi kısalır — kullanıcı yorum/video/doküman taramadan artı/eksi/fark/ideal-kullanıcıyı görür.
    * Güçlü model + sayfa metni, jenerik LLM-bilgisinden daha isabetli (sayfadaki gerçek özellik/yorum snippet'leri girdiye dahil).
    * Tek HTML geçişi: çıkarım + Tier-3 fallback + TL;DR aynı `pageText`'i paylaşır.
* **Olumsuz / Ödünleşim:**
    * Gerçek çok-kaynaklı yorum özeti değil — sayfada yorum yoksa model genel bilgiye düşer (niş üründe genel olabilir); "AI özeti" etiketi bunu belirtir.
    * Capture başına +1 LLM çağrısı (toplam 3'e çıkabilir) → ücretsiz OpenRouter'da 429 riski; arka planda olduğundan kullanıcıyı etkilemez.
    * Özet bir kez üretilir; ürün düzenlenince otomatik yenilenmez (ileride "özet yenile" eklenebilir).
