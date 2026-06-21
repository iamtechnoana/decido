'use client'

import type { ProductDTO } from '@/lib/types'
import Sparkline from './Sparkline'

function priceLabel(p: ProductDTO): string {
  if (p.price == null) return '—'
  return `${p.price.toLocaleString('tr-TR')} ${p.currency ?? ''}`.trim()
}

export default function ProductDetail({
  product: p,
  onClose,
  onStatus,
  onEdit,
  onExtend,
  onDelete,
}: {
  product: ProductDTO
  onClose: () => void
  onStatus: (status: string) => void
  onEdit: () => void
  onExtend: () => void
  onDelete: () => void
}) {
  const ns = p.needSignal
  const hist = p.priceHistory.map((h) => h.price)
  const lowest = hist.length ? Math.min(...hist) : p.price
  const targetHit = p.targetPrice != null && p.price != null && p.price <= p.targetPrice
  const atLowest = p.price != null && hist.length >= 2 && lowest != null && p.price <= lowest

  function act(s: string) {
    onStatus(s)
    onClose()
  }

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail" onClick={(e) => e.stopPropagation()}>
        <div className="detail-head">
          <span className="detail-title grotesk">{p.title ?? '(başlık çıkarılamadı)'}</span>
          <button className="btn" onClick={onClose} aria-label="Kapat">✕</button>
        </div>

        <div className="detail-scroll">
          <a href={p.url} target="_blank" rel="noreferrer" className="detail-img">
            {p.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.imageUrl} alt={p.title ?? ''} />
            ) : (
              <span className="product-thumb-empty">görsel yok</span>
            )}
          </a>

          <div className="detail-meta">
            <span className="badge">{p.domain}</span>
            {p.category && <span className="badge">{p.category}</span>}
            {p.score != null && (
              <span className="seal detail-seal"><span className="n">{p.score}</span></span>
            )}
          </div>

          <div className="detail-price grotesk">{priceLabel(p)}</div>
          {(targetHit || atLowest || p.targetPrice != null || p.alertEnabled) && (
            <div className="product-pricetrack">
              {p.alertEnabled && <span title="alarm açık">◔ alarm</span>}
              {targetHit && <span className="badge is-good">hedefte</span>}
              {!targetHit && atLowest && <span className="badge is-good">en düşük</span>}
              {p.targetPrice != null && !targetHit && (
                <span className="muted">hedef: {p.targetPrice.toLocaleString('tr-TR')} {p.currency ?? ''}</span>
              )}
            </div>
          )}
          {p.priceHistory.length >= 2 && (
            <div className="detail-spark"><Sparkline values={hist} target={p.targetPrice} width={320} height={48} /></div>
          )}

          {p.scoreReason && <p className="detail-reason">{p.scoreReason}</p>}

          {p.tldr && (p.tldr.pros.length > 0 || p.tldr.cons.length > 0 || p.tldr.edge || p.tldr.idealUser) && (
            <div className="signal signal-ai">
              <span className="signal-label">AI özeti</span>
              {p.tldr.pros.length > 0 && <span className="is-good">↑ {p.tldr.pros.join(' · ')}</span>}
              {p.tldr.cons.length > 0 && <span className="is-bad">↓ {p.tldr.cons.join(' · ')}</span>}
              {p.tldr.edge && <span>※ {p.tldr.edge}</span>}
              {p.tldr.idealUser && <span className="muted">◦ Ideal: {p.tldr.idealUser}</span>}
            </div>
          )}

          {ns && (ns.sameCategoryCount > 0 || ns.recentBuys > 0 || ns.similar) && (
            <div className="signal signal-need">
              {ns.recentBuys > 0 && (
                <span>↻ Son 6 ayda bu kategoride {ns.recentBuys} alım{ns.recentSpend > 0 ? ` (~${Math.round(ns.recentSpend).toLocaleString('tr-TR')})` : ''} — desen mi?</span>
              )}
              {ns.similar && <span className="muted">≈ Şuna çok benziyor: {ns.similar.title}</span>}
              {ns.sameCategoryCount > 0 && <span className="muted">▤ Bu kategoride {ns.sameCategoryCount} ürünün var</span>}
            </div>
          )}

          {p.specs && Object.keys(p.specs).length > 0 && (
            <dl className="detail-specs">
              {Object.entries(p.specs).map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          )}

          {p.tags && p.tags.length > 0 && (
            <div className="detail-tags">
              {p.tags.map((t) => <span key={t} className="badge">{t}</span>)}
            </div>
          )}

          {p.notes && <p className="detail-notes">{p.notes}</p>}

          <a href={p.url} target="_blank" rel="noreferrer" className="detail-store grotesk">Mağazada aç ↗</a>
        </div>

        <div className="detail-actions">
          {p.status === 'archived' ? (
            <>
              <button className="btn btn-primary" onClick={() => act('inbox')}>↩ Geri al</button>
              <button className="btn is-bad-btn" onClick={() => { onDelete(); onClose() }}>Tamamen sil</button>
            </>
          ) : (
            <>
              {p.status === 'inbox' && <button className="btn btn-primary" onClick={() => act('candidate')}>Tut</button>}
              {p.status !== 'bought' && <button className="btn" onClick={() => act('bought')}>Aldım</button>}
              <button className="btn" onClick={() => { onEdit(); onClose() }}>Düzenle</button>
              {p.status === 'inbox' && p.expiresAt && <button className="btn" onClick={() => { onExtend(); onClose() }}>Uzat</button>}
              <button className="btn" onClick={() => act('archived')}>Arşivle</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
