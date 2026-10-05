import clsx from 'clsx'
import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'stage' | 'success'
type Size = 'sm' | 'md' | 'lg' | 'xl'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}

const variants: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white shadow-[0_4px_0_0_#4c1d95] hover:bg-brand-500 active:shadow-none active:translate-y-1',
  secondary: 'bg-white text-slate-700 ring-1 ring-slate-200 shadow-[0_3px_0_0_#e2e8f0] hover:bg-slate-50 active:shadow-none active:translate-y-[3px]',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
  danger: 'bg-rose-500 text-white shadow-[0_4px_0_0_#9f1239] hover:bg-rose-400 active:shadow-none active:translate-y-1',
  success: 'bg-emerald-500 text-white shadow-[0_4px_0_0_#047857] hover:bg-emerald-400 active:shadow-none active:translate-y-1',
  stage: 'bg-white text-brand-800 shadow-[0_5px_0_0_rgba(0,0,0,0.25)] hover:bg-brand-50 active:shadow-none active:translate-y-1',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-xl gap-1.5',
  md: 'h-11 px-5 text-base rounded-2xl gap-2',
  lg: 'h-14 px-7 text-lg rounded-2xl gap-2',
  xl: 'h-16 px-9 text-xl rounded-3xl gap-3',
}

export function Button({ variant = 'primary', size = 'md', loading, icon, className, children, disabled, ...rest }: Props) {
  return (
    <button
      className={clsx(
        'inline-flex select-none items-center justify-center font-extrabold transition-all duration-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:translate-y-0',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 className="size-5 animate-spin" /> : icon}
      {children}
    </button>
  )
}
