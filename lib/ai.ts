import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

// ─── Çok-sağlayıcılı LLM katmanı ───
// Sağlayıcı LLM_PROVIDER env'i ile seçilir; verilmezse mevcut anahtara göre otomatik.
// Desteklenenler:
//   - openrouter : OpenAI-uyumlu, içinden Claude/GPT/Gemini vb. (OPENROUTER_API_KEY)
//   - anthropic  : doğrudan Claude (ANTHROPIC_API_KEY)
//   - openai     : doğrudan OpenAI (OPENAI_API_KEY)
// Karar gerekçesi: docs/adr/0007-cok-saglayici-llm.md (0003'ü süpersede eder).

export type LLMProvider = 'openrouter' | 'anthropic' | 'openai'

export const PROVIDER: LLMProvider =
  (process.env.LLM_PROVIDER as LLMProvider | undefined) ??
  (process.env.OPENROUTER_API_KEY
    ? 'openrouter'
    : process.env.ANTHROPIC_API_KEY
      ? 'anthropic'
      : 'openai')

// Sağlayıcıya göre varsayılan modeller (env ile her zaman ezilebilir).
const DEFAULTS: Record<LLMProvider, { enrich: string; compare: string }> = {
  openrouter: { enrich: 'openai/gpt-4o-mini', compare: 'anthropic/claude-3.7-sonnet' },
  anthropic: { enrich: 'claude-haiku-4-5', compare: 'claude-sonnet-4-6' },
  openai: { enrich: 'gpt-4o-mini', compare: 'gpt-4o' },
}

export const ENRICH_MODEL = process.env.ENRICH_MODEL ?? DEFAULTS[PROVIDER].enrich
export const COMPARE_MODEL = process.env.COMPARE_MODEL ?? DEFAULTS[PROVIDER].compare
// TL;DR özeti güçlü model ister; verilmezse karşılaştırma modeline düşer.
export const SUMMARY_MODEL = process.env.SUMMARY_MODEL ?? COMPARE_MODEL

if (PROVIDER === 'openrouter' && !process.env.OPENROUTER_API_KEY) {
  console.warn('[decido] OPENROUTER_API_KEY tanımlı değil — AI özellikleri çalışmaz.')
}
if (PROVIDER === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
  console.warn('[decido] ANTHROPIC_API_KEY tanımlı değil — AI özellikleri çalışmaz.')
}
if (PROVIDER === 'openai' && !process.env.OPENAI_API_KEY) {
  console.warn('[decido] OPENAI_API_KEY tanımlı değil — AI özellikleri çalışmaz.')
}

// Lazy singleton istemciler (yalnız kullanılan sağlayıcı örneklenir).
let _openai: OpenAI | null = null
let _anthropic: Anthropic | null = null

// Yavaş/limitli model capture'ı 60sn askıda bırakmasın: düşük retry + timeout.
// Hata olursa çıkarım zarifçe Tier-1'e/manuel'e düşer, enrich atlanır.
const REQUEST_TIMEOUT_MS = 25_000
const MAX_RETRIES = 1

function openaiClient(): OpenAI {
  if (_openai) return _openai
  _openai =
    PROVIDER === 'openrouter'
      ? new OpenAI({
          apiKey: process.env.OPENROUTER_API_KEY ?? '',
          baseURL: 'https://openrouter.ai/api/v1',
          timeout: REQUEST_TIMEOUT_MS,
          maxRetries: MAX_RETRIES,
          defaultHeaders: {
            // OpenRouter sıralama/atıf için önerir (zorunlu değil).
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
            'X-Title': 'DECIDO',
          },
        })
      : new OpenAI({
          apiKey: process.env.OPENAI_API_KEY ?? '',
          timeout: REQUEST_TIMEOUT_MS,
          maxRetries: MAX_RETRIES,
        })
  return _openai
}

function anthropicClient(): Anthropic {
  if (_anthropic) return _anthropic
  _anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
    timeout: REQUEST_TIMEOUT_MS,
    maxRetries: MAX_RETRIES,
  })
  return _anthropic
}

/**
 * LLM'den metin yanıtı al, içinden ilk JSON nesnesini ayıkla.
 * Seçili sağlayıcıya göre doğru istemciye yönlendirir.
 */
export async function jsonFromLLM<T>(
  model: string,
  prompt: string,
  maxTokens = 2048,
): Promise<T | null> {
  let raw = ''
  if (PROVIDER === 'anthropic') {
    const msg = await anthropicClient().messages.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    })
    raw = msg.content[0]?.type === 'text' ? msg.content[0].text : ''
  } else {
    const res = await openaiClient().chat.completions.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    })
    raw = res.choices[0]?.message?.content ?? ''
  }

  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0]) as T
  } catch {
    return null
  }
}
