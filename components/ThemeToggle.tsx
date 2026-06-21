'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light' | null>(null)

  // No-FOUC script <html data-theme> set etti; mount'ta onu oku.
  useEffect(() => {
    const t = (document.documentElement.dataset.theme as 'dark' | 'light') ?? 'dark'
    setTheme(t)
  }, [])

  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('decido-theme', next)
    } catch {
      /* yoksay */
    }
    setTheme(next)
  }

  return (
    <button
      className="btn"
      onClick={toggle}
      aria-label="Temayı değiştir"
      title="Açık / koyu tema"
    >
      {theme === 'light' ? '☾' : '☀'}
    </button>
  )
}
