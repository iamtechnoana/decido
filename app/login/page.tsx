'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setBusy(false)
    if (res.ok) {
      router.push('/')
      router.refresh()
    } else {
      setError('Hatalı parola')
    }
  }

  return (
    <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <form onSubmit={submit} className="card" style={{ padding: 28, width: 360, maxWidth: '100%' }}>
        <div className="grotesk" style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, paddingBottom: 12, marginBottom: 16, borderBottom: '2px solid var(--color-ink)' }}>
          DECIDO
          <span className="grotesk" style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--color-muted)', fontWeight: 600, marginLeft: 10 }}>karar gazetesi</span>
        </div>
        <p style={{ color: 'var(--color-muted)', fontSize: 14, marginBottom: 16, lineHeight: 1.5 }}>
          Stratejik alışveriş karar asistanın. Devam etmek için parolanı gir.
        </p>
        <input
          className="input"
          type="password"
          placeholder="Parola"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {error && <p style={{ color: 'var(--color-bad)', fontSize: 13, marginTop: 10 }}>{error}</p>}
        <button className="btn btn-primary" style={{ width: '100%', marginTop: 16, justifyContent: 'center' }} disabled={busy}>
          {busy ? 'Giriş yapılıyor…' : 'Giriş'}
        </button>
      </form>
    </main>
  )
}
