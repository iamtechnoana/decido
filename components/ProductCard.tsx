'use client'

import { useEffect, useRef, useState } from 'react'
import type { ProductDTO } from '@/lib/types'
import { EXPIRING_SOON_DAYS, DAY_MS } from '@/lib/constants'

function priceLabel(p: ProductDTO): string {
  if (p.price == null) return '—'
  return `${p.price.toLocaleString('tr-TR')} ${p.currency ?? ''}`.trim()
}

function ttlState(p: ProductDTO): { soon: boolean; expired: boolean; days: number } | null {
  if (p.status !== 'inbox' || !p.expiresAt) return null
  const ms = new Date(p.expiresAt).getTime() - Date.now()
  const days = Math.ceil(ms / DAY_MS)
  return { soon: ms < EXPIRING_SOON_DAYS * DAY_MS, expired: ms < 0, days }
}

/** Kartta gösterilecek TEK öncelikli sinyal (gerisi detayda). */
function topChip(p: ProductDTO, ttl: ReturnType<typeof ttlState>): { t: string; tone: string } | null {
  const hist = p.priceHistory.map((h) => h.price)
  const lowest = hist.length ? Math.min(...hist) : p.price
  if (p.targetPrice != null && p.price != null && p.price <= p.targetPrice) return { t: 'hedefte', tone: 'is-good' }
  if (p.price != null && hist.length >= 2 && lowest != null && p.price <= lowest) return { t: 'en düşük', tone: 'is-good' }
  if (ttl?.expired) return { t: 'süre doldu', tone: 'is-bad' }
  if (ttl?.soon) return { t: `${ttl.days}g kaldı`, tone: 'is-warn' }
  const ns = p.needSignal
  if (ns?.recentBuys && ns.recentBuys > 0) return { t: 'tekrar mı?', tone: 'is-warn' }
  if (ns?.similar) return { t: 'benzer var', tone: 'is-warn' }
  return null
}

const SWIPE_THRESHOLD = 96

export default function ProductCard({
  product: p,
  onOpen,
  onStatus,
}: {
  product: ProductDTO
  onOpen: () => void
  onStatus: (status: string) => void
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // extractionTier yoksa çıkarım henüz çalışmadı (gerçek "işleniyor").
  // Tier var ama title yoksa çıkarım çalıştı ama başarısız/bloklandı (fallback göster).
  const processing = p.title === null && p.extractionTier == null
  const failed = p.title === null && p.extractionTier != null

  // Swipe (dokunmatik): sağ = Tut, sol = Arşivle.
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ x: number; y: number; active: boolean; locked: boolean; moved: boolean } | null>(null)
  const swipeable = !processing && p.status !== 'archived'

  function onPointerDown(e: React.PointerEvent) {
    if (processing) return
    if ((e.target as HTMLElement).closest('button')) return
    drag.current = { x: e.clientX, y: e.clientY, active: true, locked: false, moved: false }
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current
    if (!d?.active) return
    const mx = e.clientX - d.x
    const my = e.clientY - d.y
    if (Math.abs(mx) > 4 || Math.abs(my) > 4) d.moved = true
    if (!d.locked) {
      if (Math.abs(my) > Math.abs(mx) && Math.abs(my) > 8) { d.active = false; return }
      if (swipeable && Math.abs(mx) > 8) { d.locked = true; setDragging(true); (e.target as HTMLElement).setPointerCapture?.(e.pointerId) }
    }
    if (d.locked) setDx(mx)
  }
  function onPointerUp(e: React.PointerEvent) {
    const d = drag.current
    drag.current = null
    setDragging(false)
    if (d?.locked) {
      if (dx > SWIPE_THRESHOLD) onStatus('candidate')
      else if (dx < -SWIPE_THRESHOLD) onStatus('archived')
      setDx(0)
      return
    }
    // sürüklenmemiş tıklama = detayı aç (butona basılmadıysa)
    if (d && !d.moved && !(e.target as HTMLElement).closest('button')) onOpen()
    setDx(0)
  }

  if (processing) {
    return (
      <article className="product product-skel" aria-busy="true">
        <div className="skel skel-thumb" />
        <div className="product-body">
          <div className="skel skel-line w50" />
          <div className="skel skel-line w80" />
          <div className="skel skel-line w35" style={{ height: 16 }} />
        </div>
      </article>
    )
  }

  if (failed) {
    const blocked = p.extractionTier === 'blocked'
    return (
      <div className="product-wrap">
        <article
          className="product product-failed product-tappable"
          role="button" tabIndex={0}
          onClick={() => onOpen()}
          onKeyDown={(e) => { if (e.key === 'Enter') onOpen() }}
        >
          <div className="product-body">
            <div className="product-meta">
              <span className="badge">{p.domain}</span>
              <span className="badge is-warn">{blocked ? 'site engelledi' : 'okunamadı'}</span>
            </div>
            <div className="product-title grotesk">Otomatik okunamadı</div>
            <p className="signal-pending">
              {blocked
                ? 'Bu site bot korumalı — sunucudan okunamıyor. Düzenleyerek elle doldur ya da mağazada aç.'
                : 'Veri çıkarılamadı. Düzenleyerek elle doldurabilirsin.'}
            </p>
            <div className="product-actions">
              <button className="btn btn-primary" onClick={onOpen}>Düzelt →</button>
            </div>
          </div>
        </article>
      </div>
    )
  }

  const ttl = mounted ? ttlState(p) : null
  const chip = mounted ? topChip(p, ttl) : null

  return (
    <div className={`product-wrap${swipeable ? ' swipeable' : ''}`}>
      {swipeable && (
        <>
          <span className="swipe-hint left" style={{ opacity: Math.min(1, Math.max(0, dx) / SWIPE_THRESHOLD) }}>Tut</span>
          <span className="swipe-hint right" style={{ opacity: Math.min(1, Math.max(0, -dx) / SWIPE_THRESHOLD) }}>Arşiv</span>
        </>
      )}
      <article
        className="product product-tappable"
        style={{ transform: dx ? `translateX(${dx}px)` : undefined, transition: dragging ? 'none' : undefined }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { drag.current = null; setDragging(false); setDx(0) }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') onOpen() }}
      >
        <div className="product-thumb">
          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imageUrl} alt={p.title ?? ''} />
          ) : (
            <span className="product-thumb-empty">görsel yok</span>
          )}
        </div>

        <div className="product-body">
          <div className="product-meta">
            <span className="badge">{p.domain}</span>
            {chip && <span className={`badge ${chip.tone}`}>{chip.t}</span>}
            {p.score != null && <span className="product-score score">{p.score}</span>}
          </div>

          <div className="product-title grotesk">{p.title ?? '(başlık çıkarılamadı)'}</div>
          <strong className="product-price grotesk">{priceLabel(p)}</strong>

          <div className="product-actions">
            {p.status === 'inbox' && <button className="btn btn-primary" onClick={() => onStatus('candidate')}>Tut</button>}
            {p.status === 'candidate' && <button className="btn btn-primary" onClick={() => onStatus('bought')}>Aldım</button>}
            {p.status === 'archived' && <button className="btn" onClick={() => onStatus('inbox')}>↩ Geri al</button>}
            <button className="btn" onClick={onOpen}>Detay →</button>
          </div>
        </div>
      </article>
    </div>
  )
}
