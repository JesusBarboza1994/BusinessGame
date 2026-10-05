import clsx from 'clsx'

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label?: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="inline-flex items-center gap-2" role="switch" aria-checked={checked}>
      <span className={clsx('relative h-7 w-12 rounded-full transition', checked ? 'bg-brand-600' : 'bg-slate-300')}>
        <span className={clsx('absolute top-1 size-5 rounded-full bg-white shadow transition-all', checked ? 'left-6' : 'left-1')} />
      </span>
      {label && <span className="text-sm font-bold text-slate-600">{label}</span>}
    </button>
  )
}
