import { describe, it, expect, vi, beforeEach } from 'vitest'

// LLM'i mock'la — gerçek API çağrısı olmasın.
vi.mock('@/lib/ai', () => ({
  ENRICH_MODEL: 'test-model',
  jsonFromLLM: vi.fn(),
}))

import { extractProduct, extractPriceOnly, domainOf } from '@/lib/extractor'
import { jsonFromLLM } from '@/lib/ai'

function mockHtml(html: string) {
  global.fetch = vi.fn().mockResolvedValue({ text: async () => html }) as unknown as typeof fetch
}

const LONG_BODY = 'Yeterince uzun gövde metni burada bulunuyor ki blok sanılmasın tamam.'

const OG_PAGE = `<html><head>
  <meta property="og:title" content="Test Ürün">
  <meta property="og:image" content="https://x.com/img.jpg">
  <meta property="og:description" content="açıklama">
  <meta property="product:price:amount" content="1299.90">
  <meta property="product:price:currency" content="TRY">
</head><body>${LONG_BODY}</body></html>`

const JSONLD_PAGE = `<html><head>
  <script type="application/ld+json">{"@type":"Product","name":"LD Ürün","image":"https://x.com/ld.jpg","description":"d","offers":{"price":"2500","priceCurrency":"USD"}}</script>
</head><body>${LONG_BODY}</body></html>`

const BLOCK_PAGE = `<html><head><title>Access Denied</title></head><body>You don't have permission to access this resource on this server.</body></html>`
const EMPTY_SPA = `<html><head><title>Shop</title></head><body><div id="root"></div></body></html>`
const INCOMPLETE_OG = `<html><head><meta property="og:title" content="Sadece Başlık"></head><body>${LONG_BODY}</body></html>`

const pricePage = (amount: string) =>
  `<html><head><meta property="og:title" content="P"><meta property="og:image" content="https://x/i.jpg"><meta property="product:price:amount" content="${amount}"><meta property="product:price:currency" content="TRY"></head><body>${LONG_BODY}</body></html>`

describe('extractProduct', () => {
  beforeEach(() => vi.clearAllMocks())

  it('OG tam → tier=og, alanlar dolu, LLM çağrılmaz', async () => {
    mockHtml(OG_PAGE)
    const r = await extractProduct('https://shop.com/p')
    expect(r.tier).toBe('og')
    expect(r.title).toBe('Test Ürün')
    expect(r.imageUrl).toBe('https://x.com/img.jpg')
    expect(r.price).toBe(1299.9)
    expect(r.currency).toBe('TRY')
    expect(jsonFromLLM).not.toHaveBeenCalled()
  })

  it('JSON-LD Product → çıkarılır', async () => {
    mockHtml(JSONLD_PAGE)
    const r = await extractProduct('https://shop.com/p')
    expect(r.title).toBe('LD Ürün')
    expect(r.imageUrl).toBe('https://x.com/ld.jpg')
    expect(r.price).toBe(2500)
    expect(r.currency).toBe('USD')
  })

  it('"Access Denied" → tier=blocked, title yok, LLM çağrılmaz', async () => {
    mockHtml(BLOCK_PAGE)
    const r = await extractProduct('https://hm.com/p')
    expect(r.tier).toBe('blocked')
    expect(r.title).toBeUndefined()
    expect(jsonFromLLM).not.toHaveBeenCalled()
  })

  it('boş SPA kabuğu (kısa gövde) → tier=blocked', async () => {
    mockHtml(EMPTY_SPA)
    const r = await extractProduct('https://spa.com/p')
    expect(r.tier).toBe('blocked')
  })

  it('eksik OG → LLM fallback; mevcut OG title korunur, görsel LLM\'den', async () => {
    mockHtml(INCOMPLETE_OG)
    vi.mocked(jsonFromLLM).mockResolvedValue({
      title: 'LLM Başlık', imageUrl: 'https://x/llm.jpg', price: 50, currency: 'TRY',
    })
    const r = await extractProduct('https://shop.com/p')
    expect(jsonFromLLM).toHaveBeenCalledOnce()
    expect(r.tier).toBe('llm')
    expect(r.title).toBe('Sadece Başlık')
    expect(r.imageUrl).toBe('https://x/llm.jpg')
  })

  it('fetch hatası → tier=manual', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network')) as unknown as typeof fetch
    const r = await extractProduct('https://x.com')
    expect(r.tier).toBe('manual')
  })

  it.each([
    ['1299.90', 1299.9],
    ['1.299,00', 1299],
    ['1,299.00', 1299],
    ['  8.499 ', 8.499],
  ])('fiyat "%s" → %d', async (amount, expected) => {
    mockHtml(pricePage(amount))
    const r = await extractProduct('https://shop.com/p')
    expect(r.price).toBe(expected)
  })
})

describe('extractPriceOnly', () => {
  it('OG fiyatı çeker (LLM yok)', async () => {
    mockHtml(OG_PAGE)
    expect(await extractPriceOnly('https://shop.com/p')).toEqual({ price: 1299.9, currency: 'TRY' })
  })
  it('fiyat yoksa null', async () => {
    mockHtml(EMPTY_SPA)
    expect(await extractPriceOnly('https://x.com')).toBeNull()
  })
})

describe('domainOf', () => {
  it('www. ayıklar', () => expect(domainOf('https://www.hm.com/p')).toBe('hm.com'))
  it('geçersiz → boş', () => expect(domainOf('saçma')).toBe(''))
})
