import clsx from 'clsx'
import { BarChart3, CircleHelp, Gamepad2, Trophy } from 'lucide-react'

import { CountdownRing } from '@/components/ui/CountdownRing'
import { useCountdown } from '@/hooks/useCountdown'
import { money } from '@/lib/format'
import type { PlayerDashboard } from '@/lib/types'

export type PlayerTab = 'decide' | 'reports' | 'ranking'

const TABS: { id: PlayerTab; label: string; icon: typeof Gamepad2 }[] = [
  { id: 'decide', label: 'Decidir', icon: Gamepad2 },
  { id: 'reports', label: 'Informes', icon: BarChart3 },
  { id: 'ranking', label: 'Ranking', icon: Trophy },
]

export function PlayerHeader({ data, tab, onTab, onHelp }: { data: PlayerDashboard; tab: PlayerTab; onTab: (tab: PlayerTab) => void; onHelp: () => void }) {
  const seconds = useCountdown(data.game.status === 'IN_PROGRESS' && data.game.cycleStatus === 'OPEN' ? data.game.cycleDeadline : null, data.serverTime)
  const position = data.ranking.find((entry) => entry.companyId === data.company.id)?.position
  const total = Math.max(1, data.game.totalCycles)
  const progress = data.game.status === 'FINISHED' ? 1 : (data.game.currentCycle - 1) / total

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2.5 sm:px-6">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-2xl" style={{ backgroundColor: `${data.company.color}22`, boxShadow: `inset 0 0 0 2px ${data.company.color}` }}>
          {data.company.avatar}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-black leading-tight">{data.company.name}</p>
          <p className="text-xs font-bold text-slate-500">
            {data.game.status === 'FINISHED' ? 'Partida terminada' : `Trimestre ${data.game.currentCycle} de ${data.game.totalCycles}`}
          </p>
        </div>

        <div className="ml-auto hidden items-center gap-5 md:flex">
          <HeaderStat label="Caja" value={money(data.snapshot.cash)} tone={data.snapshot.cash < 0 ? 'bad' : undefined} />
          <HeaderStat label="Acción" value={`$${data.snapshot.sharePrice.toFixed(2)}`} />
          <HeaderStat label="Puesto" value={position ? `#${position}/${data.ranking.length}` : '—'} />
        </div>

        <nav className="ml-auto flex items-center gap-1 rounded-2xl bg-slate-100 p-1 md:ml-4">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              aria-label={label}
              onClick={() => onTab(id)}
              className={clsx('flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-extrabold transition sm:px-3', tab === id ? 'bg-white text-brand-700 shadow' : 'text-slate-500 hover:text-slate-800')}
            >
              <Icon className="size-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </nav>
        <CountdownRing seconds={seconds} total={data.game.cycleDurationMinutes * 60} size={48} />
        <button onClick={onHelp} className="hidden rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-600 sm:block" aria-label="Cómo jugar">
          <CircleHelp className="size-5" />
        </button>
      </div>
      <div className="h-1 bg-slate-100">
        <div className="h-full bg-gradient-to-r from-brand-500 to-fuchsia-500 transition-all duration-700" style={{ width: `${progress * 100}%` }} />
      </div>
    </header>
  )
}

function HeaderStat({ label, value, tone }: { label: string; value: string; tone?: 'bad' }) {
  return (
    <div className="text-right">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className={clsx('text-sm font-black', tone === 'bad' ? 'text-rose-600' : 'text-slate-800')}>{value}</p>
    </div>
  )
}
