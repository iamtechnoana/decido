# ADR 0003: LLM Erişimi İçin Doğrudan Anthropic SDK

**Tarih:** 2026-06-19
**Durum:** Süpersede Edildi (bkz. [ADR 0007](./0007-cok-saglayici-llm.md) — çok-sağlayıcılı erişim)

## Bağlam

DECIDO iki yerde LLM kullanır: (1) item başına ucuz zenginleştirme — kategori/spec/tag,
(2) grup-içi karşılaştırma + puanlama. Bir model sağlayıcısına ve erişim biçimine karar
verilmesi gerekti. Geliştirme sırasında editör/hook entegrasyonu, kodun `lib/ai.*`
desenini görüp **Vercel AI Gateway / AI SDK** kullanmayı önerdi.

Değerlendirilen alternatifler:
1. **Vercel AI Gateway + AI SDK** — sağlayıcı soyutlama, failover, maliyet görünürlüğü; ama ek bağımlılık ve dolaylılık.
2. **Doğrudan `@anthropic-ai/sdk`** — workspace standardı; `build/demos/real-estate-ai-platform` aynı deseni kullanıyor (`lib/ai.ts`, `lib/document-extractor.ts`).
3. OpenAI/diğer sağlayıcılar — workspace standardı Claude.

Workspace tech-stack varsayılanı açıkça "Anthropic Claude — `anthropic` SDK"dır ve mevcut
çıkarım kalıbı doğrudan SDK ile yazılmıştır.

## Karar

**Doğrudan `@anthropic-ai/sdk`** kullanılmasına karar verildi. Modeller: zenginleştirme için
`claude-haiku-4-5` (ucuz, item başına), karşılaştırma için `claude-sonnet-4-6` (talep anında).
Yardımcı `jsonFromClaude()` mevcut `document-extractor.ts` desenini (prompt + JSON ayıklama)
genelleştirir. Hook'un AI Gateway önerisi **bilinçli olarak reddedildi** — kişisel ürün için
ek soyutlama gereksiz ve workspace standardından sapma yaratır.

## Sonuçlar

* **Olumlu Etkiler:**
    * Workspace genelinde tek, tutarlı LLM erişim deseni; mevcut kod birebir yeniden kullanıldı.
    * Daha az bağımlılık, daha az dolaylılık; model seçimi kodda açık (`ENRICH_MODEL`/`COMPARE_MODEL`).
* **Olumsuz Etkiler / Ödünleşimler:**
    * Sağlayıcı failover ve birleşik maliyet görünürlüğü yerleşik değil — kişisel kullanımda kabul edilebilir.
    * Sağlayıcı değişimi (ileride) erişim katmanında elle değişiklik gerektirir.
