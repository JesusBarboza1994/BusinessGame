import clsx from 'clsx'
import { motion } from 'framer-motion'
import { Skull } from 'lucide-react'

import { BotBadge } from '@/components/ui/BotBadge'
import { HelpTip } from '@/components/ui/HelpTip'
import { moneyExact, pct } from '@/lib/format'
import { HELP } from '@/lib/glossary'
import type { RankingEntry, RankingMetric } from '@/lib/types'

const MEDALS = ['🥇', '🥈', '🥉']

const METRIC_LABEL: Record<RankingMetric, string> = { TSR: 'Retorno accionista', ROI: 'ROI', ROE: 'ROE anual' }

export function RankingList({ ranking, highlightId, metric = 'TSR', dark }: { ranking: RankingEntry[]; highlightId?: string; metric?: RankingMetric; dark?: boolean }) {
  return (
    <div className="space-y-2">
      <div className={clsx('flex items-center justify-between px-3 text-[11px] font-black uppercase tracking-wider', dark ? 'text-white/60' : 'text-slate-400')}>
        <span>Empresa</span>
        <span className="flex items-center gap-1">
          {METRIC_LABEL[metric]} {metric === 'TSR' && <HelpTip text={HELP.tsr} />}
        </span>
      </div>
      {ranking.map((entry) => {
        const mine = entry.companyId === highlightId
        const bankrupt = entry.status === 'BANKRUPT'
        return (
          <motion.div
            layout
            key={entry.companyId}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={clsx(
              'flex items-center gap-3 rounded-2xl px-3 py-2.5',
              dark ? 'bg-white/10' : 'bg-white ring-1 ring-slate-100',
              mine && (dark ? 'ring-2 ring-yellow-300' : 'ring-2 ring-brand-400 bg-brand-50'),
              bankrupt && 'opacity-50',
            )}
          >
            <span className="w-7 text-center text-lg font-black">{MEDALS[entry.position - 1] ?? entry.position}</span>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl text-xl" style={{ backgroundColor: `${entry.color}25` }}>
              {entry.avatar}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-black">
                {entry.name} {entry.isBot && <BotBadge dark={dark} />} {mine && <span className={clsx('text-xs', dark ? 'text-yellow-300' : 'text-brand-500')}>(tú)</span>}
              </p>
              <p className={clsx('text-xs font-semibold', dark ? 'text-white/60' : 'text-slate-500')}>
                {bankrupt ? (
                  <span className="inline-flex items-center gap-1 text-rose-400">
                    <Skull className="size-3" /> En quiebra
                  </span>
                ) : (
                  <>Acción {moneyExact(entry.sharePrice)} · Mercado {pct(entry.marketShare, 0)}</>
                )}
              </p>
            </div>
            <span className={clsx('text-right font-black', entry.score >= 0 ? (dark ? 'text-emerald-300' : 'text-emerald-600') : dark ? 'text-rose-300' : 'text-rose-600')}>
              {bankrupt ? '—' : pct(entry.score)}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}
