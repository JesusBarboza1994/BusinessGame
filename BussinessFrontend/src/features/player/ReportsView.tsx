import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import { BotBadge } from '@/components/ui/BotBadge'
import { Card } from '@/components/ui/Card'
import { Stat } from '@/components/ui/Stat'
import { api } from '@/lib/api'
import { PRODUCT_INFO } from '@/lib/constants'
import { money, pct, units } from '@/lib/format'
import type { PlayerCycleReport, PlayerDashboard } from '@/lib/types'

import { BarsHistory, LineHistory } from '../shared/Charts'
import { BalanceSheetTable, CashFlowTable, IncomeStatementTable, IndicatorsGrid, OperationsTable } from '../shared/Statements'

type ReportTab = 'summary' | 'income' | 'balance' | 'cash' | 'indicators' | 'market'

const TABS: { id: ReportTab; label: string }[] = [
  { id: 'summary', label: '📊 Resumen' },
  { id: 'income', label: '🧾 Resultados' },
  { id: 'balance', label: '⚖️ Balance' },
  { id: 'cash', label: '💵 Flujo de caja' },
  { id: 'indicators', label: '🧮 Indicadores' },
  { id: 'market', label: '🔎 Mercado' },
]

export function ReportsView({ data }: { data: PlayerDashboard }) {
  const cycles = data.history.map((h) => h.cycle)
  const [cycle, setCycle] = useState<number | null>(cycles.at(-1) ?? null)
  const [tab, setTab] = useState<ReportTab>('summary')
  const selected = cycle ?? cycles.at(-1) ?? null

  const report = useQuery({ queryKey: ['report', selected], queryFn: () => api.report(selected as number), enabled: selected !== null })

  if (!cycles.length) {
    return (
      <Card className="mx-auto mt-8 max-w-lg p-8 text-center">
        <div className="text-6xl">📭</div>
        <h2 className="mt-3 text-2xl font-black">Aún no hay informes</h2>
        <p className="mt-2 font-semibold text-slate-500">Tus estados financieros aparecerán cuando cierre el primer trimestre.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 overflow-x-auto rounded-2xl bg-white p-1 ring-1 ring-slate-200">
          {cycles.map((c) => (
            <button
              key={c}
              onClick={() => setCycle(c)}
              className={clsx('rounded-xl px-3 py-1.5 text-sm font-black transition', c === selected ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-100')}
            >
              T{c}
            </button>
          ))}
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={clsx('shrink-0 rounded-xl px-3 py-2 text-sm font-black transition', tab === item.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50')}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'summary' && <Summary data={data} report={report.data} />}
      {tab !== 'summary' && !report.data && (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-brand-500" />
        </div>
      )}
      {report.data && tab === 'income' && (
        <Card className="p-5">
          <IncomeStatementTable report={report.data.report} />
          <DirectCosting report={report.data} />
        </Card>
      )}
      {report.data && tab === 'balance' && (
        <Card className="p-5">
          <BalanceSheetTable report={report.data.report} />
        </Card>
      )}
      {report.data && tab === 'cash' && (
        <Card className="p-5">
          <CashFlowTable report={report.data.report} />
        </Card>
      )}
      {report.data && tab === 'indicators' && <IndicatorsGrid report={report.data.report} />}
      {report.data && tab === 'market' && <MarketTab report={report.data} myId={data.company.id} />}
    </div>
  )
}

function Summary({ data, report }: { data: PlayerDashboard; report?: PlayerCycleReport }) {
  const history = data.history
  const last = history.at(-1)
  return (
    <div className="space-y-4">
      {last && (
        <Card className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
          <Stat label="Ventas" value={money(last.revenue)} />
          <Stat label="Utilidad neta" value={money(last.netIncome)} tone={last.netIncome >= 0 ? 'good' : 'bad'} />
          <Stat label="Caja" value={money(last.cash)} />
          <Stat label="Patrimonio" value={money(last.equity)} />
        </Card>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-2 font-black">Ventas y utilidad</h3>
          <BarsHistory
            data={history.map((h) => ({ cycle: h.cycle, revenue: h.revenue, netIncome: h.netIncome }))}
            series={[
              { key: 'revenue', label: 'Ventas', color: '#7c3aed' },
              { key: 'netIncome', label: 'Utilidad neta', color: '#10b981' },
            ]}
          />
        </Card>
        <Card className="p-5">
          <h3 className="mb-2 font-black">Precio de tu acción</h3>
          <LineHistory data={history.map((h) => ({ cycle: h.cycle, price: h.sharePrice }))} series={[{ key: 'price', label: 'Precio', color: '#f59e0b' }]} format={(v) => `$${v.toFixed(2)}`} />
        </Card>
        <Card className="p-5">
          <h3 className="mb-2 font-black">Demanda vs ventas (unidades)</h3>
          <BarsHistory
            data={history.map((h) => ({ cycle: h.cycle, demand: h.demand.A + h.demand.B, sales: h.sales.A + h.sales.B }))}
            series={[
              { key: 'demand', label: 'Demanda', color: '#cbd5e1' },
              { key: 'sales', label: 'Ventas', color: '#ec4899' },
            ]}
            format={(v) => units(v)}
          />
        </Card>
        <Card className="p-5">
          <h3 className="mb-2 font-black">Tus precios vs el mercado</h3>
          <LineHistory
            data={history.map((h) => {
              const industry = data.industry.find((i) => i.cycle === h.cycle)
              return { cycle: h.cycle, myA: h.price.A, avgA: industry?.averagePrice.A ?? null, myB: h.price.B, avgB: industry?.averagePrice.B ?? null }
            })}
            series={[
              { key: 'myA', label: 'Tu precio A', color: '#0ea5e9' },
              { key: 'avgA', label: 'Promedio A', color: '#7dd3fc' },
              { key: 'myB', label: 'Tu precio B', color: '#d946ef' },
              { key: 'avgB', label: 'Promedio B', color: '#f0abfc' },
            ]}
            format={(v) => `$${v.toFixed(0)}`}
          />
        </Card>
      </div>
      {report && (
        <Card className="p-5">
          <h3 className="mb-3 font-black">Operación del trimestre {report.cycle}</h3>
          <OperationsTable report={report.report} />
          {report.autoDecisions && <p className="mt-3 text-sm font-bold text-amber-600">⏱️ En este trimestre no enviaste decisiones: se repitieron las anteriores.</p>}
        </Card>
      )}
    </div>
  )
}

function DirectCosting({ report }: { report: PlayerCycleReport }) {
  const dc = report.report.directCosting
  return (
    <div className="mt-6 rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wider text-slate-400">Vista gerencial (costeo directo)</p>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Ventas" value={money(dc.revenue)} />
        <Stat label="Costos variables" value={money(dc.variableCosts)} />
        <Stat label="Margen contribución" value={money(dc.contributionMargin)} tone="good" />
        <Stat label="Costos fijos" value={money(dc.fixedCosts)} />
        <Stat label="Resultado operativo" value={money(dc.operatingIncome)} tone={dc.operatingIncome >= 0 ? 'good' : 'bad'} />
      </div>
    </div>
  )
}

function MarketTab({ report, myId }: { report: PlayerCycleReport; myId: string }) {
  const research = report.marketResearch
  return (
    <div className="space-y-4">
      <Card className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
        <Stat label="Índice económico" value={report.industry.economyIndex.toFixed(1)} />
        <Stat label="Unidades vendidas A" value={units(report.industry.totalSales.A)} />
        <Stat label="Unidades vendidas B" value={units(report.industry.totalSales.B)} />
        <Stat label="Precio promedio A / B" value={`${money(report.industry.averagePrice.A)} / ${money(report.industry.averagePrice.B)}`} />
      </Card>
      {research ? (
        <Card className="p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <h3 className="text-lg font-black">🔎 Estudio de mercado</h3>
            <p className="text-sm font-bold text-slate-500">
              Demanda total {units(research.marketSize)} u · Sin atender {units(research.unservedDemand)} u · Pronóstico próximo trimestre{' '}
              <b className="text-slate-700">{units(research.nextMarketSizeForecast)} u</b>
            </p>
          </div>
          <div className="mb-4 flex gap-2 text-sm font-black">
            <span className="rounded-full bg-sky-50 px-3 py-1 text-sky-700">Buscan precio: {pct(research.segmentWeights.PRICE, 0)}</span>
            <span className="rounded-full bg-fuchsia-50 px-3 py-1 text-fuchsia-700">Buscan calidad: {pct(research.segmentWeights.QUALITY, 0)}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="pb-2">Empresa</th>
                  <th className="pb-2">Producto</th>
                  <th className="pb-2 text-right">Precio</th>
                  <th className="pb-2 text-right">Publicidad (est.)</th>
                  <th className="pb-2 text-right">Ventas</th>
                  <th className="pb-2 text-right">Participación</th>
                  <th className="pb-2 text-right">Ranking calidad</th>
                </tr>
              </thead>
              <tbody>
                {research.competitors.map((c) => {
                  const company = research.names[c.companyId]
                  return (
                    <tr key={`${c.companyId}-${c.product}`} className={clsx('border-t border-slate-100 font-semibold', c.companyId === myId && 'bg-brand-50')}>
                      <td className="py-2">
                        {company?.avatar} <b>{company?.name ?? '—'}</b> {company?.isBot && <BotBadge />}
                      </td>
                      <td className="py-2" style={{ color: PRODUCT_INFO[c.product].color }}>
                        {PRODUCT_INFO[c.product].emoji} {c.product}
                      </td>
                      <td className="py-2 text-right">{money(c.price)}</td>
                      <td className="py-2 text-right">{money(c.estimatedAdvertising)}</td>
                      <td className="py-2 text-right">{units(c.sales)}</td>
                      <td className="py-2 text-right">{pct(c.share)}</td>
                      <td className="py-2 text-right">#{c.qualityRank}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center">
          <div className="text-5xl">🕵️</div>
          <p className="mt-2 font-black">No compraste el estudio de mercado este trimestre</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">Actívalo en el paso “Mercado” para ver precios, participación y publicidad de tus competidores.</p>
        </Card>
      )}
    </div>
  )
}
