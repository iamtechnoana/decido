import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DECIDO — Stratejik Alışveriş',
    short_name: 'DECIDO',
    description: 'Beğendiğin ürünleri biriktir, AI ile karşılaştır, doğru zamanda al.',
    start_url: '/',
    display: 'standalone',
    background_color: '#100f0d',
    theme_color: '#100f0d',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
    // PWA Share Target: başka uygulamadan "Paylaş → DECIDO" ile link doğrudan yakalanır.
    // Paylaşım, '/?url=…&text=…' olarak açılır; Board mount'ta okuyup yakalama sayfasını açar.
    share_target: {
      action: '/',
      method: 'GET',
      enctype: 'application/x-www-form-urlencoded',
      params: { title: 'title', text: 'text', url: 'url' },
    },
  } as MetadataRoute.Manifest
}
