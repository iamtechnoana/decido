'use client'

import { useState } from 'react'
import { Fraunces, Hanken_Grotesk } from 'next/font/google'
import './mockup.css'

const display = Fraunces({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '600'],
  variable: '--font-display',
})
const body = Hanken_Grotesk({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
})

type Item = {
  id: string
  name: string
  price: string
  score: number
  grad: string
  initial: string
  chip?: { text: string; tone: 'good' | 'warn' }
  sig?: string
}

const ITEMS: Item[] = [
  {
    id: '1', name: 'Sony WH-1000XM5', price: '8.499 ₺', score: 92,
    grad: 'linear-gradient(135deg,#2b3140,#0f1318)', initial: 'S',
    chip: { text: 'en düşük', tone: 'good' },
  },
  {
    id: '2', name: 'Bose QuietComfort Ultra', price: '9.299 ₺', score: 85,
    grad: 'linear-gradient(135deg,#3a2f2a,#17110d)', initial: 'B',
  },
  {
    id: '3', name: 'Sennheiser Momentum 4', price: '6.999 ₺', score: 78,
    grad: 'linear-gradient(135deg,#26323a,#0d1417)', initial: 'M',
    sig: 'Bu kategoride zaten 3 ürünün var',
  },
]

export default function MockupPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  return (
    <div
      className={`mk-root ${display.variable} ${body.variable}`}
      data-theme={theme}
    >
      <div className="mk-shell">
        <div className="mk-top">
          <span className="mk-brand">DECIDO<b>.</b></span>
          <span className="mk-spacer" />
          <button className="mk-toggle" onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}>
            {theme === 'dark' ? '☀ Açık tema' : '☾ Koyu tema'}
          </button>
        </div>

        {/* ── İNCELE: sade kartlar ── */}
        <div className="mk-eyebrow">İncele · 3 bekliyor</div>
        <div className="mk-grid">
          {ITEMS.map((it, i) => (
            <article className="mk-card" key={it.id} style={{ animationDelay: `${i * 80}ms` }}>
              <div className="mk-thumb" style={{ background: it.grad }}>{it.initial}</div>
              <div className="mk-body">
                <div className="mk-title">{it.name}</div>
                <div className="mk-priceRow">
                  <span className="mk-price">{it.price}</span>
                  {it.chip && <span className={`mk-chip ${it.chip.tone}`}>↓ {it.chip.text}</span>}
                </div>
                {it.sig && <div className="mk-sig">{it.sig}</div>}
                <div className="mk-actions">
                  <button className="mk-btn primary">Tut</button>
                  <button className="mk-btn">Aldım</button>
                  <button className="mk-btn ghost">···</button>
                </div>
              </div>
              <div className="mk-score"><span>{it.score}</span></div>
            </article>
          ))}
        </div>

        {/* ── KARAR: kahraman ── */}
        <div className="mk-eyebrow">Karar</div>
        <div className="mk-decision">
          <div className="mk-decHead">
            <div className="cat">AI karşılaştırdı · <b>kulaklık</b> · 3 ürün</div>
            <div className="mk-decSummary">
              Üçü de gürültü engellemeli; ayrım pil ömrü, ANC kalitesi ve fiyatta. Sony dengeyi en iyi kuran seçenek.
            </div>
          </div>

          <div className="mk-winner">
            <div className="mk-winLabel">★ Kazanan</div>
            <div className="mk-winMain">
              <div className="mk-winThumb" style={{ background: ITEMS[0].grad }}>S</div>
              <div className="mk-winInfo">
                <div className="mk-winName">Sony WH-1000XM5</div>
                <div className="mk-winPrice">8.499 ₺</div>
              </div>
              <div className="mk-bigScore">
                <div className="n">92</div>
                <div className="l">skor</div>
              </div>
            </div>
            <div className="mk-reasons">
              <div className="p">↑ Sınıfının en iyi ANC'si, 30 saat pil</div>
              <div className="c">↓ En pahalı ikinci seçenek</div>
            </div>
            <button className="mk-pick">Bunu seç →</button>
          </div>

          <div className="mk-runner">
            <span className="mk-rank">2</span>
            <span className="mk-runName">Bose QuietComfort Ultra</span>
            <span className="mk-runPrice">9.299 ₺</span>
            <span className="mk-runScore">85</span>
          </div>
          <div className="mk-runner">
            <span className="mk-rank">3</span>
            <span className="mk-runName">Sennheiser Momentum 4</span>
            <span className="mk-runPrice">6.999 ₺</span>
            <span className="mk-runScore">78</span>
          </div>
          <div className="mk-diff">
            <b>Fark nerede?</b> · ANC · pil ömrü · fiyat ▸
          </div>
        </div>
      </div>

      {/* ── alt navigasyon + FAB ── */}
      <nav className="mk-nav">
        <div className="mk-navInner">
          <div className="mk-navItem active"><span className="ic">◰</span>İncele</div>
          <div className="mk-navItem"><span className="ic">⚖</span>Karar</div>
          <div className="mk-fab">+</div>
          <div className="mk-navItem"><span className="ic">◷</span>Alınan</div>
          <div className="mk-navItem"><span className="ic">⋯</span>Diğer</div>
        </div>
      </nav>
    </div>
  )
}
