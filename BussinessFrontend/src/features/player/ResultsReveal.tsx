import confetti from 'canvas-confetti'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowUp, BarChart3, Play } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { Button } from '@/components/ui/Button'
import { money, pct, units } from '@/lib/format'
import type { PlayerDashboard } from '@/lib/types'

import type { PlayerTab } from './PlayerHeader'

const item = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 260, damping: 22 } },
}

export function ResultsReveal({ open, data, onClose }: { open: boolean; data: PlayerDashboard; onClose: (goTo?: PlayerTab) => void }) {
  const report = data.lastReport
  const current = data.history.at(-1)
  const previous = data.history.at(-2)
  const position = current?.position ?? null
  const previousPosition = previous?.position ?? null
  const delta = position !== null && previousPosition !== null ? previousPosition - position : 0
  const netIncome = report?.incomeStatement.netIncome ?? 0
  const priceDelta = current && previous ? current.sharePrice - previous.sharePrice : current ? current.sharePrice - data.rules.initial.shareParValue : 0
  const celebrate = open && netIncome > 0 && (delta > 0 || position === 1)

  useEffect(() => {
    if (!celebrate) return
    const id = window.setTimeout(() => void confetti({ particleCount: 180, spread: 100, origin: { y: 0.6 } }), 1400)
    return () => window.clearTimeout(id)
  }, [celebrate])

  if (!report) return null
  const ops = report.operations
  const soldUnits = ops.sales.A + ops.sales.B
  const demandUnits = ops.demand.A + ops.demand.B
  const lost = ops.lostSales.A + ops.lostSales.B

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="stage fixed inset-0 z-50 overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            className="mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center px-4 py-10 text-center"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.25, delayChildren: 0.2 } } }}
          >
            <motion.p variants={item} className="text-sm font-black uppercase tracking-[0.3em] text-yellow-200">
              Trimestre {report.cycle} cerrado
            </motion.p>
            <motion.div variants={item} className="mt-4 flex items-center gap-3">
              <span className="text-7xl font-black sm:text-8xl">#{position ?? '—'}</span>
              {delta !== 0 && (
                <span className={`flex items-center rounded-2xl px-3 py-1 text-xl font-black ${delta > 0 ? 'bg-emerald-400 text-emerald-950' : 'bg-rose-400 text-rose-950'}`}>
                  {delta > 0 ? <ArrowUp className="size-5" /> : <ArrowDown className="size-5" />}
                  {Math.abs(delta)}
                </span>
              )}
            </motion.div>
            <motion.p variants={item} className="mt-1 text-lg font-bold text-white/80">
              de {data.ranking.length} empresas
            </motion.p>

            <div className="mt-8 grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
              <RevealCard label="Utilidad neta" tone={netIncome >= 0 ? 'good' : 'bad'}>
                <AnimatedNumber value={netIncome} format={money} duration={1.4} />
              </RevealCard>
              <RevealCard label="Ventas" sub={`${units(soldUnits)} de ${units(demandUnits)} u pedidas`}>
                <AnimatedNumber value={report.incomeStatement.revenue.total} format={money} duration={1.2} />
              </RevealCard>
              <RevealCard label="Precio acción" sub={`${priceDelta >= 0 ? '+' : ''}${priceDelta.toFixed(2)}`} tone={priceDelta >= 0 ? 'good' : 'bad'}>
                ${report.indicators.sharePrice.toFixed(2)}
              </RevealCard>
              <RevealCard label="Participación" sub="del mercado total">
                {pct(ops.marketShare.total)}
              </RevealCard>
            </div>

            <motion.div variants={item} className="mt-5 w-full space-y-2 text-left">
              {report.alerts.bankrupt && (
                <Note emoji="💀">
                  Tu empresa quebró: {report.balanceSheet.equity.total < 0 ? 'tu patrimonio quedó negativo' : 'necesitaste préstamos de emergencia tres trimestres seguidos'}. Sales del mercado,
                  pero puedes revisar tus informes para entender qué pasó.
                </Note>
              )}
              {netIncome > 0 && priceDelta < 0 && (
                <Note emoji="📉">
                  Ganaste dinero, pero tu acción bajó: tu rentabilidad anualizada (ROE {pct(report.indicators.roeAnnual)}) está por debajo del {pct(data.rules.finance.costOfEquity, 0)} que esperan los
                  inversionistas.
                </Note>
              )}
              {lost > 0 && <Note emoji="📦">Te quedaste sin stock: {units(lost)} clientes quisieron comprarte y no pudieron. Algunos se fueron con la competencia.</Note>}
              {report.alerts.emergencyLoan > 0 && <Note emoji="🚨">Terminaste sin caja: el banco te dio un préstamo de emergencia de {money(report.alerts.emergencyLoan)}.</Note>}
              {report.alerts.insolvency && <Note emoji="⚠️">Tus pérdidas acumuladas superan un tercio de tu capital: estás en zona de insolvencia.</Note>}
              {report.alerts.adjustments.length > 0 && <Note emoji="✂️">Algunas decisiones no se pudieron ejecutar completas y se ajustaron automáticamente.</Note>}
              {ops.utilization < 0.5 && <Note emoji="🏭">Usaste solo el {pct(ops.utilization, 0)} de tu planta: la capacidad ociosa te costó {money(report.incomeStatement.operatingExpenses.idleCapacity)}.</Note>}
            </motion.div>

            <motion.div variants={item} className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button variant="secondary" size="lg" onClick={() => onClose('reports')} icon={<BarChart3 className="size-5" />}>
                Ver informe completo
              </Button>
              <Button variant="stage" size="lg" onClick={() => onClose('decide')} icon={<Play className="size-5" />}>
                {data.game.status === 'FINISHED' ? 'Ver resultado final' : 'Siguiente trimestre'}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function RevealCard({ label, sub, tone, children }: { label: string; sub?: string; tone?: 'good' | 'bad'; children: ReactNode }) {
  return (
    <motion.div variants={item} className="rounded-3xl bg-white p-4 text-slate-800 shadow-xl">
      <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-black ${tone === 'good' ? 'text-emerald-600' : tone === 'bad' ? 'text-rose-600' : ''}`}>{children}</p>
      {sub && <p className="text-xs font-bold text-slate-500">{sub}</p>}
    </motion.div>
  )
}

function Note({ emoji, children }: { emoji: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-white/10 p-3 text-sm font-bold ring-1 ring-white/20">
      <span className="text-lg">{emoji}</span>
      <span>{children}</span>
    </div>
  )
}
