import clsx from 'clsx'
import type { ReactNode } from 'react'

import { HelpTip } from './HelpTip'

interface Props {
  label: string
  value: ReactNode
  sub?: ReactNode
  icon?: ReactNode
  tone?: 'default' | 'good' | 'bad' | 'warn'
  help?: string
  className?: string
}

const tones = {
  default: 'text-slate-800',
  good: 'text-emerald-600',
  bad: 'text-rose-600',
  warn: 'text-amber-600',
}

export function Stat({ label, value, sub, icon, tone = 'default', help, className }: Props) {
  return (
    <div className={clsx('min-w-0', className)}>
      <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-slate-400">
        {icon}
        <span className="truncate">{label}</span>
        {help && <HelpTip text={help} title={label} />}
      </div>
      <div className={clsx('mt-0.5 truncate text-xl font-black', tones[tone])}>{value}</div>
      {sub && <div className="text-xs font-semibold text-slate-500">{sub}</div>}
    </div>
  )
}
