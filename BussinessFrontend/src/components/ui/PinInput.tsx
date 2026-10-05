import clsx from 'clsx'
import { useRef, useState } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  length?: number
  autoFocus?: boolean
}

// Big Kahoot-like PIN boxes backed by a single real input (typing, backspace and paste just work)
export function PinInput({ value, onChange, onComplete, length = 6, autoFocus }: Props) {
  const ref = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)

  return (
    <div className="relative mx-auto w-fit cursor-text" onClick={() => ref.current?.focus()}>
      <input
        ref={ref}
        autoFocus={autoFocus}
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label="PIN de la partida"
        value={value}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(event) => {
          const clean = event.target.value.replace(/\D/g, '').slice(0, length)
          onChange(clean)
          if (clean.length === length) onComplete?.(clean)
        }}
        className="absolute inset-0 z-10 w-full opacity-0"
      />
      <div className="flex gap-2 sm:gap-3">
        {Array.from({ length }, (_, index) => {
          const active = focused && index === Math.min(value.length, length - 1)
          return (
            <div
              key={index}
              className={clsx(
                'flex size-12 items-center justify-center rounded-2xl bg-white text-2xl font-black text-brand-800 shadow-[0_4px_0_0_rgba(0,0,0,0.2)] ring-4 transition sm:size-16 sm:text-3xl',
                value[index] ? 'ring-yellow-300' : active ? 'ring-white/70' : 'ring-transparent',
              )}
            >
              {value[index] ?? (active ? <span className="h-7 w-0.5 animate-pulse bg-brand-400" /> : '')}
            </div>
          )
        })}
      </div>
    </div>
  )
}
