'use client'

/** Basit SVG fiyat geçmişi grafiği. */
export default function Sparkline({
  values,
  target,
  width = 180,
  height = 36,
}: {
  values: number[]
  target?: number | null
  width?: number
  height?: number
}) {
  if (values.length < 2) return null

  const pad = 3
  const all = target != null ? [...values, target] : values
  const min = Math.min(...all)
  const max = Math.max(...all)
  const span = max - min || 1
  const x = (i: number) => pad + (i * (width - 2 * pad)) / (values.length - 1)
  const y = (v: number) => height - pad - ((v - min) / span) * (height - 2 * pad)

  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(' ')
  const last = values[values.length - 1]
  const down = last <= values[0]

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {target != null && (
        <line
          x1={pad}
          x2={width - pad}
          y1={y(target)}
          y2={y(target)}
          stroke="var(--color-warn)"
          strokeDasharray="3 3"
          strokeWidth={1}
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={down ? 'var(--color-good)' : 'var(--color-muted)'}
        strokeWidth={1.5}
      />
      <circle cx={x(values.length - 1)} cy={y(last)} r={2.5} fill={down ? 'var(--color-good)' : 'var(--color-muted)'} />
    </svg>
  )
}
