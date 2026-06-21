'use client'

import { useState } from 'react'
import type { CompareResultDTO } from '@/lib/types'

export default function ComparePanel({ groupKey, count }: { groupKey: string; count: number }) {
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
    <div style={{ marginTop: 14, borderTop: '1px solid var(--color-line)', paddingTop: 12 }}>
      {!result && (
        <button className="btn btn-primary" onClick={() => run(false)} disabled={busy}>
          {busy ? 'AI karşılaştırıyor…' : `Karşılaştır & puanla (${count})`}
        </button>
      )}
      {error && <p style={{ color: 'var(--color-bad)', fontSize: 13, marginTop: 8 }}>{error}</p>}

      {result && (
        <div>
          <div className="kicker" style={{ marginBottom: 12 }}>
            AI Karşılaştırma
            <button className="btn" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => run(true)} disabled={busy}>
              {busy ? '…' : 'Yenile'}
            </button>
          </div>

          <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 12, lineHeight: 1.5 }}>
            {result.summary}
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--color-muted)' }}>
                  <th style={th}>Ürün</th>
                  <th style={th}>Skor</th>
                  {result.specKeys.map((k) => (
                    <th key={k} style={th}>{k}</th>
                  ))}
                  <th style={th}>Artı / Eksi</th>
                </tr>
              </thead>
              <tbody>
                {result.rows
                  .slice()
                  .sort((a, b) => b.score - a.score)
                  .map((row) => {
                    const winner = row.id === result.winnerId
                    return (
                      <tr key={row.id} style={{ background: winner ? 'var(--color-signal-lt)' : undefined }}>
                        <td style={td}>
                          {winner && <span style={{ color: 'var(--color-signal)' }}>★ </span>}
                          {row.title}
                        </td>
                        <td style={{ ...td, fontWeight: 700 }}>{row.score}</td>
                        {result.specKeys.map((k) => (
                          <td key={k} style={td}>{row.specs?.[k] ?? '—'}</td>
                        ))}
                        <td style={td}>
                          <span style={{ color: 'var(--color-good)' }}>{(row.pros ?? []).join(', ') || '—'}</span>
                          {' / '}
                          <span style={{ color: 'var(--color-bad)' }}>{(row.cons ?? []).join(', ') || '—'}</span>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

const th: React.CSSProperties = { padding: '6px 8px', borderBottom: '1px solid var(--color-line)', whiteSpace: 'nowrap' }
const td: React.CSSProperties = { padding: '6px 8px', borderBottom: '1px solid var(--color-line)', verticalAlign: 'top' }
