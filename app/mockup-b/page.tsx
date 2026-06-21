'use client'

import { useState } from 'react'
import { Bricolage_Grotesque, Newsreader } from 'next/font/google'
import './mockupb.css'

const grotesk = Bricolage_Grotesque({
  subsets: ['latin', 'latin-ext'],
  weight: ['600', '700', '800'],
  variable: '--font-grotesk',
})
const serif = Newsreader({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
})

export default function MockupB() {
  const [theme, setTheme] = useState<'dark' | 'light'>('light')

  return (
    <div className={`mb-root ${grotesk.variable} ${serif.variable}`} data-theme={theme}>
      <div className="mb-shell">
        <div className="mb-mast">
          <span className="mb-logo">DECIDO</span>
          <span className="mb-tagline">karar gazetesi</span>
          <button className="mb-toggle" onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}>
            {theme === 'dark' ? 'Açık' : 'Koyu'}
          </button>
        </div>

        {/* İNCELE */}
        <div className="mb-kicker">İncele — 3 bekliyor</div>

        <div className="mb-row" style={{ animationDelay: '0ms' }}>
          <div className="mb-thumb" style={{ background: 'linear-gradient(135deg,#2b3140,#0f1318)' }}>S</div>
          <div className="mb-rowBody">
            <div className="mb-rowName">Sony WH-1000XM5</div>
            <div className="mb-rowMeta">8.499 ₺ · <span className="lo">şu an en düşük</span></div>
            <div className="mb-rowActs"><a>Tut</a><a className="mut">Aldım</a><a className="mut">···</a></div>
          </div>
          <div className="mb-rowScore">92</div>
        </div>

        <div className="mb-row" style={{ animationDelay: '70ms' }}>
          <div className="mb-thumb" style={{ background: 'linear-gradient(135deg,#3a2f2a,#17110d)' }}>B</div>
          <div className="mb-rowBody">
            <div className="mb-rowName">Bose QuietComfort Ultra</div>
            <div className="mb-rowMeta">9.299 ₺</div>
            <div className="mb-rowActs"><a>Tut</a><a className="mut">Aldım</a><a className="mut">···</a></div>
          </div>
          <div className="mb-rowScore">85</div>
        </div>

        <div className="mb-row" style={{ animationDelay: '140ms' }}>
          <div className="mb-thumb" style={{ background: 'linear-gradient(135deg,#26323a,#0d1417)' }}>M</div>
          <div className="mb-rowBody">
            <div className="mb-rowName">Sennheiser Momentum 4</div>
            <div className="mb-rowMeta">6.999 ₺ · <i>bu kategoride 3 ürünün var</i></div>
            <div className="mb-rowActs"><a>Tut</a><a className="mut">Aldım</a><a className="mut">···</a></div>
          </div>
          <div className="mb-rowScore">78</div>
        </div>

        {/* KARAR — verdict */}
        <div className="mb-verdict">
          <div className="mb-kicker">Karar</div>
          <div className="mb-vKicker">AI karşılaştırdı · <b>Kulaklık</b> · 3 ürün</div>
          <p className="mb-lede">
            Üçü de gürültü engellemeli; ayrım pil ömrü, ANC kalitesi ve fiyatta. Dengeyi en iyi kuran net.
          </p>

          <div className="mb-best">
            <span className="mb-bestStamp">★ En iyi seçim</span>
            <div className="mb-bestMain">
              <div className="mb-bestName">Sony WH-1000XM5</div>
              <div className="mb-stamp"><span className="n">92</span></div>
            </div>
            <div className="mb-bestPrice">8.499 ₺</div>
            <blockquote className="mb-quote">
              Sınıfının en iyi ANC'si ve 30 saat pil — fiyatı yüksek ama karşılığını veriyor.
            </blockquote>
            <div className="mb-con">↓ En pahalı ikinci seçenek</div>
            <button className="mb-pick">Bunu seç →</button>
          </div>

          <div className="mb-also">Diğerleri</div>
          <div className="mb-rank">
            <span className="mb-rankNo">02</span>
            <span className="mb-rankName">Bose QuietComfort Ultra</span>
            <span className="mb-rankPrice">9.299 ₺</span>
            <span className="mb-rankScore">85</span>
          </div>
          <div className="mb-rank">
            <span className="mb-rankNo">03</span>
            <span className="mb-rankName">Sennheiser Momentum 4</span>
            <span className="mb-rankPrice">6.999 ₺</span>
            <span className="mb-rankScore">78</span>
          </div>
        </div>
      </div>

      <nav className="mb-nav">
        <div className="mb-navInner">
          <div className="mb-navItem active"><span className="ic">▤</span>İNCELE</div>
          <div className="mb-navItem"><span className="ic">⚖</span>KARAR</div>
          <div className="mb-fab">+</div>
          <div className="mb-navItem"><span className="ic">▣</span>ALINAN</div>
          <div className="mb-navItem"><span className="ic">⋯</span>DİĞER</div>
        </div>
      </nav>
    </div>
  )
}
