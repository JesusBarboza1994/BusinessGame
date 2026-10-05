import clsx from 'clsx'

export function Logo({ light, size = 'md' }: { light?: boolean; size?: 'md' | 'lg' }) {
  return (
    <div className={clsx('flex items-center gap-2 font-black', light ? 'text-white' : 'text-brand-800', size === 'lg' ? 'text-3xl' : 'text-lg')}>
      <svg viewBox="0 0 64 64" className={size === 'lg' ? 'size-12' : 'size-8'}>
        <rect width="64" height="64" rx="16" fill={light ? '#ffffff' : '#6d28d9'} />
        <path d="M14 46 L26 32 L34 38 L50 18" stroke={light ? '#6d28d9' : '#fde047'} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="50" cy="18" r="5" fill={light ? '#6d28d9' : '#fde047'} />
      </svg>
      <span>
        Business<span className={light ? 'text-yellow-300' : 'text-brand-500'}>Sim</span>
      </span>
    </div>
  )
}
