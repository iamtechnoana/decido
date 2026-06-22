import { describe, it, expect, vi } from 'vitest'

// capture.ts ağır modülleri import ediyor; saf fonksiyonları test etmek için mock'la.
vi.mock('next/server', () => ({ after: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ prisma: {} }))
vi.mock('@/lib/enrich', () => ({ enrichProduct: vi.fn() }))
vi.mock('@/lib/summary', () => ({ generateTldr: vi.fn() }))
vi.mock('@/lib/needmap', () => ({ computeNeedSignal: vi.fn() }))
vi.mock('@/lib/extractor', () => ({ extractProduct: vi.fn(), domainOf: (u: string) => u }))

import { normalizeUrl, firstUrl } from '@/lib/capture'

describe('normalizeUrl', () => {
  it('takip parametrelerini ve fragment\'i atar', () => {
    expect(normalizeUrl('https://x.com/p?utm_source=a&id=5&utm_campaign=b#frag'))
      .toBe('https://x.com/p?id=5')
  })
  it('gclid/fbclid temizler', () => {
    expect(normalizeUrl('https://x.com/p?gclid=z')).toBe('https://x.com/p')
  })
  it('gerçek parametreleri korur', () => {
    expect(normalizeUrl('https://x.com/p?color=red&size=M')).toBe('https://x.com/p?color=red&size=M')
  })
  it('geçersiz url → trim edilmiş ham', () => {
    expect(normalizeUrl('  saçma metin ')).toBe('saçma metin')
  })
})

describe('firstUrl', () => {
  it('metindeki ilk linki bulur', () => {
    expect(firstUrl('bak şu https://x.com/p güzelmiş')).toBe('https://x.com/p')
  })
  it('link yoksa null', () => {
    expect(firstUrl('hiç link yok burada')).toBeNull()
  })
})
