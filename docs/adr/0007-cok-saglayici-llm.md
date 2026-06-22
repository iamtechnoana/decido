# ADR 0007: Çok-Sağlayıcılı LLM Erişimi (OpenRouter / Anthropic / OpenAI)

**Tarih:** 2026-06-19
**Durum:** Kabul Edildi (ADR 0003'ü süpersede eder)

## Bağlam

ADR 0003 doğrudan `@anthropic-ai/sdk` kullanımına karar vermişti. Ancak pratikte bir
Anthropic API anahtarı her zaman elde olmayabiliyor; başlangıçta **OpenRouter** üzerinden
(OpenAI-uyumlu, tek anahtarla içinden Claude/GPT/Gemini çağrılabilen) ilerlemek gerekiyor.
Tek bir sağlayıcıya kilitlenmek, anahtar/erişim değiştiğinde kod değişikliği gerektiriyor.

Değerlendirilen alternatifler:
1. Sadece OpenRouter — basit ama doğrudan Anthropic/OpenAI'ye dönüşü zorlaştırır.
2. Sadece Anthropic (eski 0003) — anahtar yokken çalışmaz.
3. **Çok-sağlayıcı soyutlama** — env ile seçilebilir openrouter | anthropic | openai.
4. Vercel AI Gateway / AI SDK — failover + maliyet görünürlüğü, ama ek bağımlılık ve
   workspace standardından (doğrudan SDK) sapma. (Editör hook'u önerdi; **reddedildi**.)

## Karar

`lib/ai.ts` **çok-sağlayıcılı** hâle getirildi. Sağlayıcı `LLM_PROVIDER` env'i ile seçilir;
verilmezse dolu olan anahtara göre otomatik belirlenir:
* **openrouter** — OpenAI SDK + `https://openrouter.ai/api/v1` (varsayılan başlangıç).
* **anthropic** — doğrudan `@anthropic-ai/sdk` (anahtar olunca; eski 0003 yolu korunur).
* **openai** — doğrudan OpenAI.

Modeller sağlayıcıya göre makul varsayılanlarla gelir, `ENRICH_MODEL`/`COMPARE_MODEL` ile
ezilebilir. İstemciler lazy singleton (yalnız kullanılan sağlayıcı örneklenir). Birleştirici
`jsonFromLLM()` sağlayıcıdan bağımsız JSON döndürür. Vercel AI Gateway önerisi bilinçli
reddedildi (doğrudan SDK, daha az dolaylılık).

## Sonuçlar

* **Olumlu Etkiler:**
    * Anahtar/erişim değişince kod değişmez; yalnız `.env` (`LLM_PROVIDER` + anahtar) güncellenir.
    * OpenRouter ile tek anahtardan birçok modele erişim; Anthropic'e geçiş hazır (0003 yolu korunur).
    * Model adları env'den ayarlanır → ücretsiz/ekonomik modellerle deneme kolay.
* **Olumsuz Etkiler / Ödünleşimler:**
    * İki SDK bağımlılığı (`openai` + `@anthropic-ai/sdk`) taşınır.
    * Model adları sağlayıcıya göre farklı biçimlidir (OpenRouter `saglayici/model` vs Anthropic düz ad) — varsayılanlar bunu yönetir, elle ezerken dikkat gerekir.
