import { Card } from '@/components/ui/Card'
import { pct } from '@/lib/format'
import type { PlayerDashboard } from '@/lib/types'

import { LineHistory } from '../shared/Charts'
import { RankingList } from '../shared/RankingList'
import { AchievementsGrid } from './AchievementsGrid'

export function RankingPanel({ data }: { data: PlayerDashboard }) {
  const positions = data.history.filter((h) => h.position !== null).map((h) => ({ cycle: h.cycle, position: h.position as number }))
  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
      <Card className="p-5">
        <h2 className="mb-4 text-xl font-black">🏆 Ranking de la bolsa</h2>
        <RankingList ranking={data.ranking} highlightId={data.company.id} metric={data.rules.rankingMetric} />
      </Card>
      <div className="space-y-5">
        <Card className="p-5">
          <h3 className="font-black">Tu posición en el tiempo</h3>
          {positions.length > 0 ? (
            <LineHistory
              data={positions}
              series={[{ key: 'position', label: 'Puesto', color: '#7c3aed' }]}
              format={(v) => `#${Math.round(v)}`}
              height={180}
              yDomain={[1, Math.max(2, data.ranking.length)]}
              yReversed
            />
          ) : (
            <p className="mt-2 text-sm font-semibold text-slate-500">Aparecerá después del primer trimestre.</p>
          )}
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 font-black">Mercado total por trimestre</h3>
          {data.industry.length ? (
            <LineHistory
              data={data.industry.map((i) => ({ cycle: i.cycle, A: i.totalSales.A, B: i.totalSales.B }))}
              series={[
                { key: 'A', label: 'Unidades A', color: '#0ea5e9' },
                { key: 'B', label: 'Unidades B', color: '#d946ef' },
              ]}
              format={(v) => `${Math.round(v)}`}
              height={180}
            />
          ) : (
            <p className="text-sm font-semibold text-slate-500">Sin datos aún.</p>
          )}
          <p className="mt-2 text-xs font-semibold text-slate-400">
            Índice económico actual: <b className="text-slate-600">{data.economy.current.toFixed(1)}</b> · pronóstico próximo trimestre {data.economy.forecastNextQuarter?.toFixed(1) ?? '—'} · a un año{' '}
            {data.economy.forecastNextYear?.toFixed(1) ?? '—'}
            {data.economy.forecastNextQuarter !== null && ` (${pct(data.economy.forecastNextQuarter / data.economy.current - 1)})`}
          </p>
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 font-black">Tus logros</h3>
          <AchievementsGrid data={data} />
        </Card>
      </div>
    </div>
  )
}
