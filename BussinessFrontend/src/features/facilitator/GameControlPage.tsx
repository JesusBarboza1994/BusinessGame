import { useQuery, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Copy, Download, FastForward, Maximize2, Play, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'

import { BotBadge } from '@/components/ui/BotBadge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CountdownRing } from '@/components/ui/CountdownRing'
import { Modal } from '@/components/ui/Modal'
import { FullScreenLoader } from '@/components/ui/Spinner'
import { useCountdown } from '@/hooks/useCountdown'
import { api, ApiError } from '@/lib/api'
import { money, pct, units } from '@/lib/format'
import { session } from '@/lib/session'
import { useLiveGame } from '@/lib/socket'
import type { GameDetail } from '@/lib/types'

import { LineHistory } from '../shared/Charts'
import { BotPanel } from './BotPanel'
import { Podium } from '../shared/Podium'
import { RankingList } from '../shared/RankingList'

export function GameControlPage() {
  const { gameId } = useParams()
  const queryClient = useQueryClient()
  const token = session.facilitatorToken()
  const game = useQuery({
    queryKey: ['game', gameId],
    queryFn: () => api.game(gameId as string),
    enabled: Boolean(token && gameId),
    refetchInterval: (q) => (q.state.data?.cycleStatus === 'PROCESSING' ? 2_000 : 15_000),
  })

  useLiveGame(gameId, () => {
    void queryClient.invalidateQueries({ queryKey: ['game', gameId] })
  })

  if (!token) return <Navigate to="/facilitator/login" replace />
  if (game.error instanceof ApiError && game.error.status === 404) return <Navigate to="/facilitator" replace />
  if (!game.data) return <FullScreenLoader label="Cargando partida…" />

  const data = game.data
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link to="/facilitator" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Volver">
            <ArrowLeft className="size-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-black">{data.name}</h1>
            <p className="text-xs font-bold text-slate-500">
              PIN <span className="font-mono text-brand-600">{data.pin}</span> · {data.companies} empresas · {data.totalCycles} trimestres de {data.cycleDurationMinutes} min
            </p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        {data.status === 'LOBBY' && <LobbyControl data={data} />}
        {data.status === 'IN_PROGRESS' && <LiveControl data={data} />}
        {data.status === 'FINISHED' && <FinishedControl data={data} />}
      </main>
    </div>
  )
}

function LobbyControl({ data }: { data: GameDetail }) {
  const queryClient = useQueryClient()
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const joinUrl = `${window.location.origin}/join?pin=${data.pin}`

  const start = async () => {
    setStarting(true)
    setError(null)
    try {
      await api.startGame(data.id)
      await queryClient.invalidateQueries({ queryKey: ['game', data.id] })
    } catch (err) {
      setError((err as ApiError).message)
    } finally {
      setStarting(false)
    }
  }

  const pinPanel = (
    <div className="stage-bg flex h-full flex-col items-center justify-center rounded-[2rem] p-8 text-center">
      <p className="text-lg font-black uppercase tracking-[0.3em] text-white/70">Únete en</p>
      <p className="mt-1 text-2xl font-black text-yellow-300">{window.location.host}</p>
      <p className="mt-6 text-sm font-black uppercase tracking-widest text-white/70">con el PIN</p>
      <p className="font-mono text-6xl font-black tracking-[0.2em] sm:text-8xl">{data.pin}</p>
      <div className="mt-6 rounded-3xl bg-white p-3">
        <QRCodeSVG value={joinUrl} size={fullscreen ? 220 : 150} fgColor="#4c1d95" />
      </div>
    </div>
  )

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="relative min-h-[420px]">
        {pinPanel}
        <div className="absolute right-4 top-4 flex gap-2">
          <button onClick={() => void navigator.clipboard?.writeText(joinUrl)} className="rounded-xl bg-white/15 p-2 text-white hover:bg-white/25" aria-label="Copiar enlace">
            <Copy className="size-5" />
          </button>
          <button onClick={() => setFullscreen(true)} className="rounded-xl bg-white/15 p-2 text-white hover:bg-white/25" aria-label="Pantalla completa">
            <Maximize2 className="size-5" />
          </button>
        </div>
      </div>

      <Card className="flex flex-col p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">Empresas en la sala</h2>
          <span className="rounded-full bg-brand-100 px-3 py-1 text-sm font-black text-brand-700">{data.companiesDetail.length}</span>
        </div>
        <div className="mt-4 flex flex-1 flex-wrap content-start gap-2">
          <AnimatePresence>
            {data.companiesDetail.map((company) => (
              <motion.span
                key={company.id}
                layout
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="group flex items-center gap-2 rounded-2xl bg-slate-50 py-2 pl-2 pr-3 font-black ring-1 ring-slate-200"
              >
                <span className="flex size-8 items-center justify-center rounded-xl text-lg" style={{ backgroundColor: `${company.color}25` }}>
                  {company.avatar}
                </span>
                {company.name}
                {company.isBot && <BotBadge />}
                <button
                  onClick={() => void api.removeCompany(data.id, company.id)}
                  className="ml-1 hidden rounded-full p-0.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600 group-hover:block"
                  aria-label={`Expulsar ${company.name}`}
                >
                  <X className="size-3.5" />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
          {data.companiesDetail.length === 0 && <p className="font-semibold text-slate-400">Esperando a que se unan las primeras empresas…</p>}
        </div>
        <BotPanel gameId={data.id} />
        {error && <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-600">{error}</p>}
        <Button size="xl" className="mt-6 w-full" disabled={data.companiesDetail.length === 0} loading={starting} onClick={start} icon={<Play className="size-6" />}>
          Comenzar partida
        </Button>
        <p className="mt-2 text-center text-xs font-semibold text-slate-400">Al comenzar ya no se podrán unir más empresas.</p>
      </Card>

      <Modal open={fullscreen} onClose={() => setFullscreen(false)} wide>
        <div className="-m-6 h-[80vh]">{pinPanel}</div>
      </Modal>
    </div>
  )
}

function LiveControl({ data }: { data: GameDetail }) {
  const seconds = useCountdown(data.cycleStatus === 'OPEN' ? data.cycleDeadline : null, data.serverTime)
  const [closing, setClosing] = useState(false)
  const [detailCycle, setDetailCycle] = useState<number | null>(null)
  const humans = data.companiesDetail.filter((c) => c.status === 'ACTIVE' && !c.isBot)
  const submitted = humans.filter((c) => c.submitted).length
  const active = humans.length
  const bots = data.companiesDetail.filter((c) => c.status === 'ACTIVE' && c.isBot).length

  const forceClose = async () => {
    setClosing(true)
    try {
      await api.closeCycle(data.id)
    } finally {
      setClosing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="stage-bg flex flex-wrap items-center gap-6 rounded-[2rem] p-6">
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-white/70">Trimestre</p>
          <p className="text-5xl font-black">
            {data.currentCycle}
            <span className="text-white/50">/{data.totalCycles}</span>
          </p>
        </div>
        <CountdownRing seconds={seconds} total={data.cycleDurationMinutes * 60} size={96} light />
        <div className="min-w-[200px] flex-1">
          <p className="font-black">
            {data.cycleStatus === 'PROCESSING'
              ? '⚙️ Calculando resultados…'
              : active === 0
                ? '🤖 Solo hay bots: el trimestre cierra por tiempo o cuando tú lo cierres'
                : `${submitted} de ${active} ${active === 1 ? 'jugador envió' : 'jugadores enviaron'} sus decisiones`}
            {bots > 0 && data.cycleStatus !== 'PROCESSING' && active > 0 && <span className="ml-2 text-sm text-white/70">(+ {bots} bots siempre listos)</span>}
          </p>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/20">
            <motion.div className="h-full rounded-full bg-yellow-300" animate={{ width: `${(submitted / Math.max(1, active)) * 100}%` }} />
          </div>
        </div>
        <Button variant="stage" size="lg" onClick={forceClose} loading={closing} disabled={data.cycleStatus !== 'OPEN'} icon={<FastForward className="size-5" />}>
          Cerrar trimestre ahora
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card className="p-5">
          <h2 className="mb-3 text-lg font-black">Estado de las empresas</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {data.companiesDetail.map((company) => (
              <div
                key={company.id}
                className={clsx(
                  'rounded-2xl p-3 ring-1 transition',
                  company.status === 'BANKRUPT' ? 'bg-slate-100 opacity-50 ring-slate-200' : company.submitted ? 'bg-emerald-50 ring-emerald-200' : 'bg-white ring-slate-200',
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{company.avatar}</span>
                  <span className="truncate text-sm font-black">{company.name}</span>
                </div>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {company.status === 'BANKRUPT' ? '💀 En quiebra' : company.isBot ? '🤖 Automático' : company.submitted ? '✅ Listo' : '⏳ Decidiendo…'}
                </p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 text-lg font-black">Ranking</h2>
          <RankingList ranking={data.ranking} metric={data.settings.rankingMetric} />
        </Card>
      </div>

      <MarketCharts data={data} onCycle={setDetailCycle} />
      <CycleDetailModal gameId={data.id} cycle={detailCycle} onClose={() => setDetailCycle(null)} />
    </div>
  )
}

function MarketCharts({ data, onCycle }: { data: GameDetail; onCycle: (cycle: number) => void }) {
  if (!data.marketHistory.length) return null
  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-black">El mercado</h2>
        <div className="flex flex-wrap gap-1">
          {data.marketHistory.map((m) => (
            <button key={m.cycle} onClick={() => onCycle(m.cycle)} className="rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-black text-slate-600 hover:bg-brand-100 hover:text-brand-700">
              Ver T{m.cycle}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div>
          <p className="mb-1 text-sm font-black text-slate-500">Demanda y ventas (u)</p>
          <LineHistory
            data={data.marketHistory.map((m) => ({ cycle: m.cycle, size: m.marketSize, sold: m.totalSales.A + m.totalSales.B }))}
            series={[
              { key: 'size', label: 'Demanda', color: '#94a3b8' },
              { key: 'sold', label: 'Vendido', color: '#7c3aed' },
            ]}
            format={(v) => units(v)}
          />
        </div>
        <div>
          <p className="mb-1 text-sm font-black text-slate-500">Precio promedio</p>
          <LineHistory
            data={data.marketHistory.map((m) => ({ cycle: m.cycle, A: m.averagePrice.A, B: m.averagePrice.B }))}
            series={[
              { key: 'A', label: 'Producto A', color: '#0ea5e9' },
              { key: 'B', label: 'Producto B', color: '#d946ef' },
            ]}
            format={(v) => `$${v.toFixed(0)}`}
          />
        </div>
        <div>
          <p className="mb-1 text-sm font-black text-slate-500">Índice económico</p>
          <LineHistory
            data={data.economyHistory.map((value, cycle) => ({ cycle, value }))}
            series={[{ key: 'value', label: 'Índice', color: '#f59e0b' }]}
            format={(v) => v.toFixed(0)}
          />
        </div>
      </div>
    </Card>
  )
}

function CycleDetailModal({ gameId, cycle, onClose }: { gameId: string; cycle: number | null; onClose: () => void }) {
  const detail = useQuery({ queryKey: ['cycle', gameId, cycle], queryFn: () => api.cycle(gameId, cycle as number), enabled: cycle !== null })
  return (
    <Modal open={cycle !== null} onClose={onClose} wide>
      <h2 className="text-2xl font-black">Resultados del trimestre {cycle}</h2>
      {detail.data && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                <th className="pb-2">Empresa</th>
                <th className="pb-2 text-right">Precio A/B</th>
                <th className="pb-2 text-right">Ventas u A/B</th>
                <th className="pb-2 text-right">Ventas $</th>
                <th className="pb-2 text-right">Utilidad</th>
                <th className="pb-2 text-right">Caja</th>
                <th className="pb-2 text-right">Mercado</th>
                <th className="pb-2 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {detail.data.companies.map(({ id, name, avatar, isBot, autoDecisions, report }) => (
                <tr key={id} className="border-t border-slate-100 font-semibold">
                  <td className="py-2">
                    {avatar} <b>{name}</b> {isBot && <BotBadge />} {autoDecisions && <span className="ml-1 rounded bg-amber-100 px-1.5 text-[10px] font-black text-amber-700">AUTO</span>}
                  </td>
                  <td className="py-2 text-right">
                    {money(report.operations.price.A)} / {money(report.operations.price.B)}
                  </td>
                  <td className="py-2 text-right">
                    {units(report.operations.sales.A)} / {units(report.operations.sales.B)}
                  </td>
                  <td className="py-2 text-right">{money(report.incomeStatement.revenue.total)}</td>
                  <td className={clsx('py-2 text-right font-black', report.incomeStatement.netIncome >= 0 ? 'text-emerald-600' : 'text-rose-600')}>{money(report.incomeStatement.netIncome)}</td>
                  <td className="py-2 text-right">{money(report.balanceSheet.assets.cash)}</td>
                  <td className="py-2 text-right">{pct(report.operations.marketShare.total)}</td>
                  <td className="py-2 text-right">${report.indicators.sharePrice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs font-semibold text-slate-400">
            Demanda total {units(detail.data.market.marketSize)} u · sin atender {units(detail.data.market.unservedDemand)} u · índice económico {detail.data.market.economyIndex.toFixed(1)}
          </p>
        </div>
      )}
    </Modal>
  )
}

function FinishedControl({ data }: { data: GameDetail }) {
  const [detailCycle, setDetailCycle] = useState<number | null>(null)
  const downloadCsv = () => {
    const header = ['Puesto', 'Empresa', 'Puntaje', 'TSR', 'ROI', 'Precio acción', 'Patrimonio', 'Participación', 'Estado']
    const rows = data.ranking.map((r) => [r.position, r.name, r.score, r.tsr, r.roi, r.sharePrice, r.equity, r.marketShare, r.status])
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `ranking-${data.pin}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="space-y-6">
      <div className="stage-bg rounded-[2rem] px-6 py-10 text-center">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-yellow-200">Partida terminada</p>
        <h2 className="mt-2 text-4xl font-black">🏆 {data.ranking[0]?.name ?? '—'} gana</h2>
        <div className="mt-10">
          <Podium ranking={data.ranking} />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black">Ranking final</h2>
            <Button variant="secondary" size="sm" onClick={downloadCsv} icon={<Download className="size-4" />}>
              CSV
            </Button>
          </div>
          <RankingList ranking={data.ranking} metric={data.settings.rankingMetric} />
        </Card>
        <MarketCharts data={data} onCycle={setDetailCycle} />
      </div>
      <CycleDetailModal gameId={data.id} cycle={detailCycle} onClose={() => setDetailCycle(null)} />
    </div>
  )
}
