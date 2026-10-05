import clsx from 'clsx'

import { formatClock } from '@/hooks/useCountdown'

interface Props {
  seconds: number | null
  total: number
  size?: number
  light?: boolean
}

export function CountdownRing({ seconds, total, size = 56, light }: Props) {
  if (seconds === null) return null
  const radius = size / 2 - 5
  const circumference = 2 * Math.PI * radius
  const fraction = total > 0 ? Math.min(1, seconds / total) : 0
  const urgent = seconds <= 30
  const color = urgent ? '#f43f5e' : seconds <= total * 0.33 ? '#f59e0b' : light ? '#ffffff' : '#7c3aed'
  return (
    <div className={clsx('relative inline-flex items-center justify-center', urgent && 'animate-pulse')} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={light ? 'rgba(255,255,255,0.2)' : '#e2e8f0'} strokeWidth={5} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.3s' }}
        />
      </svg>
      <span className={clsx('absolute text-xs font-black', light ? 'text-white' : 'text-slate-700')}>{formatClock(seconds)}</span>
    </div>
  )
}
