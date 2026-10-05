import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useId } from 'react'

interface Props<T extends string> {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}

export function Segmented<T extends string>({ value, options, onChange }: Props<T>) {
  const id = useId()
  return (
    <div className="inline-flex rounded-2xl bg-slate-100 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={clsx('relative rounded-xl px-3 py-1.5 text-sm font-extrabold transition', value === option.value ? 'text-brand-700' : 'text-slate-500 hover:text-slate-700')}
        >
          {value === option.value && <motion.span layoutId={id} className="absolute inset-0 rounded-xl bg-white shadow" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
          <span className="relative">{option.label}</span>
        </button>
      ))}
    </div>
  )
}
