'use client'

import { useState } from 'react'
import type { CompareResultDTO } from '@/lib/types'

export default function ComparePanel({
  groupKey,
  count,
  onPick,
}: {
  groupKey: string
  count: number
  onPick?: (id: string, title: string) => void
}) {
  const [result, setResult] = useState<CompareResultDTO | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function run(force = false) {
    setBusy(true)
    setError('')
    const res = await fetch('/api/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupKey, force }),
    })
    setBusy(false)
    if (res.ok) setResult(await res.json())
    else setError((await res.json().catch(() => ({})))?.error ?? 'Karşılaştırma başarısız')
  }

  if (count < 2) return null

  return (
    <div className="compare">
      {!result && (
        <button className="btn btn-primary" onClick={() => run(false)} disabled={busy}>
          {busy ? 'AI karşılaştırıyor…' : `Karşılaştır & puanla (${count})`}
        </button>
      )}
      {error && <p className="compare-error">{error}</p>}
      {result && <VerdictView result={result} busy={busy} onRefresh={() => run(true)} onPick={onPick} />}
    </div>
  )
}

/** Karar anı (verdict) — kazanan-kahraman görünüm. */
export function VerdictView({
  result,
  busy,
  onRefresh,
  onPick,
}: {
  result: CompareResultDTO
  busy?: boolean
  onRefresh?: () => void
  onPick?: (id: string, title: string) => void
}) {
  const [showDiff, setShowDiff] = useState(false)
  const rows = [...result.rows].sort((a, b) => b.score - a.score)
  const winner = rows.find((r) => r.id === result.winnerId) ?? rows[0]
  const runners = rows.filter((r) => r.id !== winner?.id)

  if (!winner) return null

  return (
    <div className="verdict">
      <div className="kicker muted" style={{ marginBottom: 8 }}>
        AI Karşılaştırma
        {onRefresh && (
          <button className="btn" style={{ padding: '3px 8px', fontSize: 11 }} onClick={onRefresh} disabled={busy}>
            {busy ? '…' : 'Yenile'}
          </button>
        )}
      </div>

      {result.summary && <p className="verdict-summary">{result.summary}</p>}

      <div className="verdict-best">
        <span className="stamp">★ En iyi seçim</span>
        <div className="verdict-main">
          <h3 className="verdict-name grotesk">{winner.title}</h3>
          <div className="seal verdict-seal"><span className="n">{winner.score}</span></div>
        </div>
        {winner.reason && <blockquote className="pull-quote verdict-quote">{winner.reason}</blockquote>}
        <div className="verdict-reasons">
          {(winner.pros ?? []).length > 0 && <div className="is-good">↑ {winner.pros.join(' · ')}</div>}
          {(winner.cons ?? []).length > 0 && <div className="is-bad">↓ {winner.cons.join(' · ')}</div>}
        </div>
        {onPick && (
          <button className="verdict-pick grotesk" onClick={() => onPick(winner.id, winner.title)}>
            Bunu seç →
          </button>
        )}
      </div>

      {runners.length > 0 && (
        <>
          <div className="verdict-also grotesk">Diğerleri</div>
          {runners.map((r, i) => (
            <div className="verdict-rank" key={r.id}>
              <span className="verdict-rankNo grotesk">{String(i + 2).padStart(2, '0')}</span>
              <span className="verdict-rankName">{r.title}</span>
              <span className="verdict-rankScore grotesk">{r.score}</span>
            </div>
          ))}
        </>
      )}

      {result.specKeys.length > 0 && (
        <button className="verdict-diff grotesk" onClick={() => setShowDiff((s) => !s)}>
          Fark nerede? · {result.specKeys.slice(0, 4).join(' · ')} {showDiff ? '▴' : '▾'}
        </button>
      )}

      {showDiff && (
        <div className="verdict-table-wrap">
          <table className="verdict-table">
            <thead>
              <tr>
                <th>Ürün</th>
                <th>Skor</th>
                {result.specKeys.map((k) => <th key={k}>{k}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={row.id === winner.id ? 'is-winner' : undefined}>
                  <td>{row.id === winner.id && '★ '}{row.title}</td>
                  <td className="grotesk" style={{ fontWeight: 800 }}>{row.score}</td>
                  {result.specKeys.map((k) => <td key={k}>{row.specs?.[k] ?? '—'}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
