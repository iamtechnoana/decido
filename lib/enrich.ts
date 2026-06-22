import { ENRICH_MODEL, jsonFromLLM } from './ai'

export interface Enrichment {
  category: string
  tags: string[]
  specs: Record<string, string>
}

/**
 * Item başına ucuz zenginleştirme (Haiku): kategori ata, anahtar spec'leri
 * normalize et, etiketler üret. Otomatik gruplama bu `category` ile yapılır.
 */
export async function enrichProduct(input: {
  title?: string | null
  description?: string | null
  price?: number | null
  domain?: string | null
}): Promise<Enrichment | null> {
  const prompt = `Bir ürünü sınıflandır. Sadece geçerli JSON döndür:
{
  "category": "kısa, tutarlı kategori adı (örn: 'kablosuz kulaklık', 'koşu ayakkabısı', 'mutfak robotu'). Benzer ürünler AYNI kategoriye düşmeli; küçük harf, tekil.",
  "tags": ["3-6 kısa etiket: marka, renk, özellik vb."],
  "specs": { "anahtar": "değer" }
}
'specs' için ürün türüne uygun 3-8 ayırt edici özellik çıkar (örn elektronikte 'pil ömrü', 'bağlantı'; giyimde 'malzeme', 'beden aralığı'). Bilinmiyorsa boş bırak, uydurma.

ÜRÜN:
Başlık: ${input.title ?? '(yok)'}
Açıklama: ${(input.description ?? '').slice(0, 1500)}
Fiyat: ${input.price ?? '(yok)'}
Site: ${input.domain ?? '(yok)'}`

  const result = await jsonFromLLM<Enrichment>(ENRICH_MODEL, prompt, 1024)
  if (!result) return null
  return {
    category: (result.category || 'sınıflandırılmamış').toLowerCase().trim(),
    tags: Array.isArray(result.tags) ? result.tags.slice(0, 8).map(String) : [],
    specs:
      result.specs && typeof result.specs === 'object'
        ? Object.fromEntries(
            Object.entries(result.specs)
              .filter(([, v]) => v != null && String(v).trim() !== '')
              .map(([k, v]) => [k, String(v)]),
          )
        : {},
  }
}
