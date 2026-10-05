import clsx from 'clsx'
import type { ReactNode } from 'react'

export function StepCard({ title, subtitle, emoji, accent, children, className, right }: { title: string; subtitle?: string; emoji?: string; accent?: string; children: ReactNode; className?: string; right?: ReactNode }) {
  return (
    <section className={clsx('card overflow-hidden', className)}>
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5" style={accent ? { background: `linear-gradient(90deg, ${accent}14, transparent)` } : undefined}>
        {emoji && <span className="text-2xl">{emoji}</span>}
        <div className="min-w-0 flex-1">
          <h3 className="font-black text-slate-800">{title}</h3>
          {subtitle && <p className="text-xs font-semibold text-slate-500">{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className="space-y-6 p-5">{children}</div>
    </section>
  )
}
