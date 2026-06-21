'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ProductDTO } from '@/lib/types'
import { EXTEND_TTL_DAYS, DAY_MS } from '@/lib/constants'
import ProductCard from './ProductCard'
import ComparePanel from './ComparePanel'
import EditModal from './EditModal'
import ThemeToggle from './ThemeToggle'

type StatusFilter = 'inbox' | 'candidate' | 'bought' | 'archived'

const STATUS_LABEL: Record<StatusFilter, string> = {
  inbox: 'İncele',
  candidate: 'Aday',
  bought: 'Alındı',
  archived: 'Eriyik',
}
/** Alt-navda görünen ana durumlar (Eriyik = "Diğer" sayfasında). */
const NAV_STATUSES: StatusFilter[] = ['inbox', 'candidate', 'bought']

/** Son 7 günde yakalanan sayısı (modül seviyesi — Date.now() render'da yasak). */
function countThisWeek(products: ProductDTO[]): number {
  const weekAgo = Date.now() - 7 * DAY_MS
  return products.filter((p) => new Date(p.capturedAt).getTime() >= weekAgo).length
}

/** Paylaşılan metin/URL'den ilk linki çıkar (PWA Share Target). */
function firstUrl(...vals: (string | null)[]): string {
  for (const v of vals) {
    const m = v?.match(/https?:\/\/\S+/i)
    if (m) return m[0]
  }
  return ''
}

export default function Board({ initialProducts }: { initialProducts: ProductDTO[] }) {
  const router = useRouter()
  const [products, setProducts] = useState<ProductDTO[]>(initialProducts)
  const [filter, setFilter] = useState<StatusFilter>('inbox')
  const [url, setUrl] = useState('')
  const [capturing, setCapturing] = useState(false)
  const [busy, setBusy] = useState('')
  const [flash, setFlash] = useState('')
  const [editing, setEditing] = useState<ProductDTO | null>(null)
  const [sheet, setSheet] = useState<'capture' | 'more' | null>(null)

  const refresh = useCallback(async (): Promise<ProductDTO[] | null> => {
    const res = await fetch('/api/products')
    if (!res.ok) return null
    const data = await res.json()
    setProducts(data.products)
    return data.products as ProductDTO[]
  }, [])

  // Yakalama anlık döner; çıkarım/enrich arka planda. "İşlenenler" bitene kadar yenile.
  const pollProcessing = useCallback(async () => {
    for (let i = 0; i < 12; i++) {
      await new Promise((r) => setTimeout(r, 5000))
      const list = await refresh()
      if (list && !list.some((p) => p.title === null || p.enrichedAt === null)) break
    }
  }, [refresh])

  const capture = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const urls = url.split(/\s+/).filter((u) => /^https?:\/\//i.test(u))
      if (!urls.length) return
      setCapturing(true)
      setFlash('')
      let added = 0
      let dup = 0
      for (const u of urls) {
        const res = await fetch('/api/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: u, source: 'web' }),
        })
        if (res.status === 201) added++
        else if (res.status === 200) dup++
      }
      setUrl('')
      setCapturing(false)
      setSheet(null)
      setFilter('inbox')
      setFlash(`${added} eklendi${dup ? `, ${dup} zaten vardı` : ''} · arka planda işleniyor…`)
      await refresh()
      void pollProcessing()
    },
    [url, refresh, pollProcessing],
  )

  // PWA Share Target: '/?url=…&text=…' ile açıldıysa yakalama sayfasını ön-doldur.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const shared = firstUrl(q.get('url'), q.get('text'), q.get('title'))
    if (shared) {
      setUrl(shared)
      setSheet('capture')
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  const patch = useCallback(async (id: string, data: Partial<ProductDTO>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)))
    await fetch(`/api/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  }, [])

  const extend = useCallback(
    (p: ProductDTO) => {
      const base = p.expiresAt ? new Date(p.expiresAt).getTime() : Date.now()
      const next = new Date(Math.max(base, Date.now()) + EXTEND_TTL_DAYS * DAY_MS).toISOString()
      void patch(p.id, { expiresAt: next })
      setFlash(`Süre ${EXTEND_TTL_DAYS} gün uzatıldı.`)
    },
    [patch],
  )

  const remove = useCallback(async (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
    await fetch(`/api/products/${id}`, { method: 'DELETE' })
  }, [])

  const runJob = useCallback(
    async (path: string, label: string, msg: (s: Record<string, unknown>) => string) => {
      setBusy(label)
      setFlash('')
      setSheet(null)
      const res = await fetch(path, { method: 'POST' })
      setBusy('')
      if (res.ok) {
        setFlash(msg(await res.json()))
        await refresh()
      } else {
        setFlash(`${label} başarısız`)
      }
    },
    [refresh],
  )

  async function logout() {
    await fetch('/api/login', { method: 'DELETE' })
    router.push('/login')
    router.refresh()
  }

  const visible = useMemo(() => products.filter((p) => p.status === filter), [products, filter])

  const groups = useMemo(() => {
    const map = new Map<string, ProductDTO[]>()
    for (const p of visible) {
      const key = p.category ?? '— işleniyor —'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [visible])

  const counts = useMemo(() => {
    const c: Record<string, number> = { inbox: 0, candidate: 0, bought: 0, archived: 0 }
    for (const p of products) c[p.status] = (c[p.status] ?? 0) + 1
    return c
  }, [products])

  const thisWeek = countThisWeek(products)

  function pick(s: StatusFilter) {
    setFilter(s)
    setSheet(null)
  }

  return (
    <main className="board">
      {/* ── künye ── */}
      <header className="masthead">
        <span className="brand grotesk">DECIDO</span>
        <span className="tagline grotesk">{STATUS_LABEL[filter].toLowerCase()}</span>
        <ThemeToggle />
      </header>

      <p className="lede">
        Bu hafta <b>{thisWeek}</b> kayıt · <b>{counts.inbox}</b> incelenmemiş bekliyor
        {counts.inbox > 0 && ' — birkaçını hızlıca ele.'}
      </p>

      {flash && <p className="flash">{flash}</p>}

      {groups.length === 0 && (
        <p className="empty">
          {filter === 'inbox'
            ? 'İncelenmemiş kutusu boş. Sağ alttaki + ile link ekle — düşünmeden.'
            : `Henüz ${STATUS_LABEL[filter].toLowerCase()} ürün yok.`}
        </p>
      )}

      <div className="groups">
        {groups.map(([category, items]) => (
          <section key={category} className="group">
            <div className="kicker">
              {category} <span className="badge">{items.length}</span>
            </div>
            <div className="card-grid">
              {items.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onEdit={() => setEditing(p)}
                  onStatus={(status) => patch(p.id, { status })}
                  onExtend={() => extend(p)}
                  onDelete={() => remove(p.id)}
                />
              ))}
            </div>
            {filter !== 'archived' && !category.startsWith('—') && (
              <ComparePanel groupKey={`category:${category}`} count={items.length} />
            )}
          </section>
        ))}
      </div>

      {/* ── alt navigasyon + FAB ── */}
      <nav className="botnav">
        <div className="botnav-inner">
          {NAV_STATUSES.slice(0, 2).map((s) => (
            <button key={s} className={`botnav-item grotesk${filter === s ? ' active' : ''}`} onClick={() => pick(s)}>
              <span className="botnav-n">{counts[s] ?? 0}</span>
              {STATUS_LABEL[s]}
            </button>
          ))}
          <button className="fab" onClick={() => setSheet('capture')} aria-label="Link yakala">+</button>
          <button className={`botnav-item grotesk${filter === 'bought' ? ' active' : ''}`} onClick={() => pick('bought')}>
            <span className="botnav-n">{counts.bought ?? 0}</span>
            {STATUS_LABEL.bought}
          </button>
          <button className={`botnav-item grotesk${sheet === 'more' || filter === 'archived' ? ' active' : ''}`} onClick={() => setSheet('more')}>
            <span className="botnav-ic">⋯</span>
            Diğer
          </button>
        </div>
      </nav>

      {/* ── yakalama sayfası (sheet) ── */}
      {sheet === 'capture' && (
        <Sheet title="Link yakala" onClose={() => setSheet(null)}>
          <form onSubmit={capture} className="sheet-capture">
            <input
              className="input"
              placeholder="Ürün linki yapıştır — tek tık, gerisini sistem halleder"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoFocus
            />
            <button className="btn btn-accent" disabled={capturing}>
              {capturing ? 'Ekleniyor…' : 'Ekle'}
            </button>
          </form>
          <p className="sheet-hint">Birden çok linki boşlukla ayırarak aynı anda ekleyebilirsin.</p>
        </Sheet>
      )}

      {/* ── diğer (sheet) ── */}
      {sheet === 'more' && (
        <Sheet title="Diğer" onClose={() => setSheet(null)}>
          <button className={`sheet-row grotesk${filter === 'archived' ? ' active' : ''}`} onClick={() => pick('archived')}>
            Eriyik (arşiv) <span className="badge">{counts.archived ?? 0}</span>
          </button>
          <hr className="rule" />
          <button className="sheet-row grotesk" onClick={() => runJob('/api/price-check', 'Fiyat kontrol', (s) => `Fiyat: ${s.priced}/${s.checked} · ${s.alerts} alarm`)} disabled={!!busy}>
            {busy === 'Fiyat kontrol' ? 'Kontrol ediliyor…' : 'Fiyatları kontrol et'}
          </button>
          <button className="sheet-row grotesk" onClick={() => runJob('/api/maintenance', 'Bakım', (s) => `Bakım: ${(s.ttl as { archived: number })?.archived ?? 0} arşivlendi`)} disabled={!!busy}>
            {busy === 'Bakım' ? 'Bakım…' : 'Bakım (süresi dolanları arşivle)'}
          </button>
          <button className="sheet-row grotesk" onClick={() => { setSheet(null); void refresh() }}>Yenile</button>
          <hr className="rule" />
          <button className="sheet-row grotesk is-bad" onClick={logout}>Çıkış</button>
        </Sheet>
      )}

      {editing && (
        <EditModal
          product={editing}
          onClose={() => setEditing(null)}
          onSave={async (data) => {
            await patch(editing.id, data)
            setEditing(null)
          }}
        />
      )}
    </main>
  )
}

/** Mobil bottom-sheet (alttan açılan panel). */
function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <span className="sheet-title grotesk">{title}</span>
          <button className="btn" onClick={onClose} aria-label="Kapat">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
