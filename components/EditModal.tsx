'use client'

import { useState } from 'react'
import type { ProductDTO } from '@/lib/types'

export default function EditModal({
  product,
  onClose,
  onSave,
}: {
  product: ProductDTO
  onClose: () => void
  onSave: (data: Partial<ProductDTO>) => void | Promise<void>
}) {
  const [title, setTitle] = useState(product.title ?? '')
  const [price, setPrice] = useState(product.price != null ? String(product.price) : '')
  const [currency, setCurrency] = useState(product.currency ?? '')
  const [category, setCategory] = useState(product.category ?? '')
  const [notes, setNotes] = useState(product.notes ?? '')
  const [targetPrice, setTargetPrice] = useState(product.targetPrice != null ? String(product.targetPrice) : '')
  const [alertEnabled, setAlertEnabled] = useState(product.alertEnabled)

  function save() {
    onSave({
      title: title.trim() || null,
      price: price.trim() ? Number(price) : null,
      currency: currency.trim() || null,
      category: category.trim().toLowerCase() || null,
      notes: notes.trim() || null,
      targetPrice: targetPrice.trim() ? Number(targetPrice) : null,
      alertEnabled,
    })
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'grid', placeItems: 'center', padding: 16, zIndex: 50,
      }}
    >
      <div className="card" onClick={(e) => e.stopPropagation()} style={{ padding: 20, width: 420, maxWidth: '100%' }}>
        <h3 className="grotesk" style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3, marginBottom: 14 }}>Ürünü düzenle</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Field label="Başlık"><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
          <div style={{ display: 'flex', gap: 10 }}>
            <Field label="Fiyat"><input className="input" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
            <Field label="Para birimi"><input className="input" value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="TRY" /></Field>
          </div>
          <Field label="Kategori (gruplama anahtarı)">
            <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} />
          </Field>
          <Field label="Hedef fiyat (alarm için)">
            <input className="input" inputMode="decimal" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} />
          </Field>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-ink)' }}>
            <input type="checkbox" checked={alertEnabled} onChange={(e) => setAlertEnabled(e.target.checked)} />
            🔔 Fiyat alarmını aç (periyodik kontrol et, hedef/en-düşükte haber ver)
          </label>
          <Field label="Not">
            <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button className="btn" onClick={onClose}>Vazgeç</button>
          <button className="btn btn-primary" onClick={save}>Kaydet</button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
      <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{label}</span>
      {children}
    </label>
  )
}
