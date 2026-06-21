'use client'

import type { ProductDTO } from '@/lib/types'
import { EXPIRING_SOON_DAYS, DAY_MS } from '@/lib/constants'
import Sparkline from './Sparkline'

function priceLabel(p: ProductDTO): string {
  if (p.price == null) return '—'
  return `${p.price.toLocaleString('tr-TR')} ${p.currency ?? ''}`.trim()
}

/** TTL durumu: kaç gün kaldı / doldu mu. */
function ttlState(p: ProductDTO): { soon: boolean; expired: boolean; days: number } | null {
  if (p.status !== 'inbox' || !p.expiresAt) return null
  const ms = new Date(p.expiresAt).getTime() - Date.now()
  const days = Math.ceil(ms / DAY_MS)
  return { soon: ms < EXPIRING_SOON_DAYS * DAY_MS, expired: ms < 0, days }
}

export default function ProductCard({
  product: p,
  onEdit,
  onStatus,
  onExtend,
  onDelete,
}: {
  product: ProductDTO
  onEdit: () => void
  onStatus: (status: string) => void
  onExtend: () => void
  onDelete: () => void
}) {
  const processing = p.title === null
  const ttl = ttlState(p)
  const ns = p.needSignal

  const hist = p.priceHistory.map((h) => h.price)
  const lowest = hist.length ? Math.min(...hist) : p.price
  const targetHit = p.targetPrice != null && p.price != null && p.price <= p.targetPrice
  const atLowest = p.price != null && hist.length >= 2 && lowest != null && p.price <= lowest
  const showPrice = targetHit || atLowest || p.targetPrice != null || p.alertEnabled

  return (
    <article className="product">
      <a href={p.url} target="_blank" rel="noreferrer" className="product-thumb">
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.imageUrl} alt={p.title ?? ''} />
        ) : (
          <span className="product-thumb-empty">{processing ? 'işleniyor…' : 'görsel yok'}</span>
        )}
      </a>

      <div className="product-body">
        <div className="product-meta">
          <span className="badge">{p.domain}</span>
          {ttl && (
            <span className={`badge ${ttl.expired ? 'is-bad' : 'is-warn'}`}>
              {ttl.expired ? 'süresi doldu' : `${ttl.days}g kaldı`}
            </span>
          )}
          {p.score != null && (
            <span className="product-score score" title={p.scoreReason ?? ''}>{p.score}</span>
          )}
        </div>

        <a href={p.url} target="_blank" rel="noreferrer" className="product-title grotesk">
          {processing ? 'işleniyor…' : (p.title ?? '(başlık çıkarılamadı — düzenle)')}
        </a>

        <strong className="product-price grotesk">{priceLabel(p)}</strong>

        {/* TL;DR — 3 saniyelik özet */}
        {p.tldr && (p.tldr.pros.length > 0 || p.tldr.cons.length > 0 || p.tldr.edge || p.tldr.idealUser) ? (
          <div className="signal signal-ai">
            <span className="signal-label" title="Sayfa içeriği + model bilgisinden üretildi; canlı yorum garantisi değil">
              AI özeti
            </span>
            {p.tldr.pros.length > 0 && <span className="is-good">↑ {p.tldr.pros.join(' · ')}</span>}
            {p.tldr.cons.length > 0 && <span className="is-bad">↓ {p.tldr.cons.join(' · ')}</span>}
            {p.tldr.edge && <span>※ {p.tldr.edge}</span>}
            {p.tldr.idealUser && <span className="muted">◦ {p.tldr.idealUser}</span>}
          </div>
        ) : (
          !processing && <span className="signal-pending">özet hazırlanıyor…</span>
        )}

        {/* İhtiyaç eşleme (dürtü farkındalığı) */}
        {ns && (ns.sameCategoryCount > 0 || ns.recentBuys > 0 || ns.similar) && (
          <div className="signal signal-need">
            {ns.recentBuys > 0 && (
              <span>↻ Son 6 ayda bu kategoride {ns.recentBuys} alım{ns.recentSpend > 0 ? ` (~${Math.round(ns.recentSpend).toLocaleString('tr-TR')})` : ''} — desen mi?</span>
            )}
            {ns.similar && <span className="muted">≈ Şuna çok benziyor: {ns.similar.title}</span>}
            {ns.recentBuys === 0 && !ns.similar && ns.sameCategoryCount > 0 && (
              <span className="muted">▤ Bu kategoride zaten {ns.sameCategoryCount} ürünün var</span>
            )}
          </div>
        )}

        {/* Fiyat takibi sinyalleri */}
        {showPrice && (
          <div className="product-pricetrack">
            {p.alertEnabled && <span title="alarm açık">◔</span>}
            {targetHit && <span className="badge is-good">hedefte</span>}
            {!targetHit && atLowest && <span className="badge is-good">en düşük</span>}
            {p.targetPrice != null && !targetHit && (
              <span className="muted">hedef: {p.targetPrice.toLocaleString('tr-TR')} {p.currency ?? ''}</span>
            )}
          </div>
        )}
        {p.priceHistory.length >= 2 && <Sparkline values={hist} target={p.targetPrice} width={208} height={34} />}

        {p.notes && <p className="product-notes">{p.notes}</p>}

        {/* Durum-duyarlı triaj */}
        <div className="product-actions">
          {p.status === 'archived' ? (
            <>
              <button className="btn" onClick={() => onStatus('inbox')}>↩ Geri al</button>
              {p.archiveReason && <span className="badge">{p.archiveReason === 'ttl' ? 'süre doldu' : 'elendi'}</span>}
              <button className="btn is-bad-btn" onClick={onDelete}>Sil</button>
            </>
          ) : (
            <>
              {p.status === 'inbox' && <button className="btn btn-primary" onClick={() => onStatus('candidate')}>Tut</button>}
              {p.status !== 'bought' && <button className="btn" onClick={() => onStatus('bought')}>Aldım</button>}
              <button className="btn" onClick={onEdit}>Düzenle</button>
              {ttl && <button className="btn" onClick={onExtend} title="Süreyi uzat">Uzat</button>}
              <button className="btn" onClick={() => onStatus('archived')}>Arşivle</button>
            </>
          )}
        </div>
      </div>
    </article>
  )
}
