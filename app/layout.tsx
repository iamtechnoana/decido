import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Newsreader } from 'next/font/google'
import './globals.css'

const grotesk = Bricolage_Grotesque({
  subsets: ['latin', 'latin-ext'],
  weight: ['600', '700', '800'],
  variable: '--font-grotesk',
  display: 'swap',
})
const serif = Newsreader({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'DECIDO — Stratejik Alışveriş',
  description: 'Beğendiğin ürünleri biriktir, AI ile karşılaştır, doğru zamanda al.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'DECIDO' },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#efe9da' },
    { media: '(prefers-color-scheme: dark)', color: '#100f0d' },
  ],
  width: 'device-width',
  initialScale: 1,
}

/** FOUC'suz tema: ilk boyamadan önce localStorage/sistem tercihini uygula. */
const themeScript = `
(function(){try{
  var t=localStorage.getItem('decido-theme');
  if(!t){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}
  document.documentElement.dataset.theme=t;
}catch(e){document.documentElement.dataset.theme='dark';}})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" data-theme="dark" suppressHydrationWarning className={`${grotesk.variable} ${serif.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
