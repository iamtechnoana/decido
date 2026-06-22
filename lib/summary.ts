import { SUMMARY_MODEL, jsonFromLLM } from './ai'

export interface Tldr {
  pros: string[]
  cons: string[]
  edge: string // bu ürünü farklı kılan tek cümle
  idealUser: string // kim için ideal, tek cümle
}

/**
 * "3 saniyelik özet": artı/eksi/fark/ideal-kullanıcı. Güçlü model.
 * Kaynak = sayfa metni (varsa yorum snippet'leri) + modelin genel bilgisi.
 * DÜRÜST: gerçek canlı yorum garantisi yok — niş üründe genel olabilir (UI'da "AI özeti" etiketi).
 */
export async function generateTldr(input: {
  title?: string | null
  description?: string | null
  category?: string | null
  price?: number | null
  domain?: string | null
  pageText?: string | null
}): Promise<Tldr | null> {
  if (!input.title) return null

  const prompt = `Bir alıcıya 3 saniyede karar verdirecek özet çıkar. Aşağıdaki SAYFA METNİ
(varsa kullanıcı yorumları/özellikler) + genel bilgine dayan. Emin değilsen genel ve KISA tut,
ASLA uydurma sayısal özellik verme. Sadece geçerli JSON döndür:
{
  "pros": ["2-4 kısa artı (yorumlardan/özelliklerden çıkarılan)"],
  "cons": ["2-4 kısa eksi"],
  "edge": "bu ürünü bu fiyatta/segmentte farklı kılan tek cümle",
  "idealUser": "kim için ideal — tek cümle (örn: 'spor yapan, siyah seven')"
}

ÜRÜN:
Başlık: ${input.title}
Kategori: ${input.category ?? '(yok)'}
Fiyat: ${input.price ?? '(yok)'}
Site: ${input.domain ?? '(yok)'}
Açıklama: ${(input.description ?? '').slice(0, 800)}

SAYFA METNİ:
---
${(input.pageText ?? '').slice(0, 6000)}
---`

  const r = await jsonFromLLM<Tldr>(SUMMARY_MODEL, prompt, 1024)
  if (!r) return null
  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? v.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 4) : []
  return {
    pros: arr(r.pros),
    cons: arr(r.cons),
    edge: typeof r.edge === 'string' ? r.edge.trim() : '',
    idealUser: typeof r.idealUser === 'string' ? r.idealUser.trim() : '',
  }
}
