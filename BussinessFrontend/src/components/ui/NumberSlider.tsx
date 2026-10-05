import clsx from 'clsx'
import type { ReactNode } from 'react'

import { HelpTip } from './HelpTip'

interface Props {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max: number
  step?: number
  color?: string
  prefix?: string
  suffix?: string
  help?: string
  hint?: ReactNode
  marker?: { value: number; label: string }
  error?: boolean
  disabled?: boolean
  integer?: boolean
}

// Slider + editable number: dragging is fun, typing is precise
export function NumberSlider({ label, value, onChange, min = 0, max, step = 1, color = '#7c3aed', prefix, suffix, help, hint, marker, error, disabled, integer = true }: Props) {
  const safeMax = Math.max(max, min + step, value)
  const fill = ((Math.min(value, safeMax) - min) / (safeMax - min)) * 100
  const markerPos = marker ? ((Math.min(marker.value, safeMax) - min) / (safeMax - min)) * 100 : null
  const commit = (raw: number) => {
    if (!Number.isFinite(raw)) return
    const clean = Math.max(min, integer ? Math.round(raw) : Math.round(raw * 100) / 100)
    onChange(clean)
  }

  return (
    <div className={clsx('space-y-2', disabled && 'pointer-events-none opacity-50')}>
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-1.5 text-sm font-extrabold text-slate-700">
          {label}
          {help && <HelpTip text={help} title={label} />}
        </label>
        <div
          className={clsx(
            'flex items-center rounded-xl bg-slate-50 px-2 ring-2 transition focus-within:ring-brand-400',
            error ? 'ring-rose-400 bg-rose-50' : 'ring-slate-200',
          )}
        >
          {prefix && <span className="text-sm font-bold text-slate-400">{prefix}</span>}
          <input
            type="number"
            inputMode="decimal"
            value={Number.isFinite(value) ? value : 0}
            min={min}
            step={step}
            onChange={(event) => commit(Number(event.target.value))}
            className="w-24 bg-transparent py-1.5 text-right text-base font-black text-slate-800 outline-none"
          />
          {suffix && <span className="pl-1 text-sm font-bold text-slate-400">{suffix}</span>}
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          className="slider w-full"
          min={min}
          max={safeMax}
          step={step}
          value={Math.min(value, safeMax)}
          onChange={(event) => commit(Number(event.target.value))}
          style={{ ['--fill' as string]: `${fill}%`, ['--track-fill' as string]: error ? '#f43f5e' : color }}
        />
        {markerPos !== null && marker && (
          <div className="pointer-events-none absolute -top-1 flex -translate-x-1/2 flex-col items-center" style={{ left: `${markerPos}%` }}>
            <div className="h-4 w-0.5 rounded bg-slate-500/60" />
            <span className="mt-3 whitespace-nowrap text-[10px] font-black uppercase text-slate-400">{marker.label}</span>
          </div>
        )}
      </div>
      {hint && <div className={clsx('text-xs font-semibold', marker ? 'pt-3' : '', 'text-slate-500')}>{hint}</div>}
    </div>
  )
}
