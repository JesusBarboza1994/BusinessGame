import clsx from 'clsx'

import { NumberSlider } from '@/components/ui/NumberSlider'
import { PRODUCT_INFO, PRODUCTS, STEP_THEME } from '@/lib/constants'
import { money, ratio } from '@/lib/format'
import { HELP } from '@/lib/glossary'

import { IssueList } from './IssueList'
import { StepCard } from './StepCard'
import type { StepProps } from './step.types'

export function MarketStep({ data, decisions, update, validation, issues }: StepProps) {
  const lastIndustry = data.industry.at(-1)
  const research = decisions.marketing.buyMarketResearch
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-2">
        {PRODUCTS.map((product) => {
          const info = PRODUCT_INFO[product]
          const price = decisions.marketing.price[product]
          const unitCost = validation?.projection.estimatedUnitCost[product] ?? 0
          const variable = validation?.projection.variableUnitCost[product] ?? 0
          const margin = price - unitCost
          const average = lastIndustry?.averagePrice[product] ?? data.rules.refPrice[product]
          return (
            <StepCard key={product} title={info.name} subtitle={info.tagline} emoji={info.emoji} accent={info.color}>
              <NumberSlider
                label="Precio de venta"
                help={HELP.price}
                prefix="$"
                value={price}
                min={1}
                max={Math.round(data.rules.refPrice[product] * 2.2)}
                step={0.5}
                integer={false}
                color={info.color}
                marker={{ value: average, label: lastIndustry ? 'Promedio mercado' : 'Referencia' }}
                error={price < variable}
                onChange={(value) => update((d) => void (d.marketing.price[product] = Math.max(1, value)))}
                hint={
                  <span className="flex flex-wrap gap-2">
                    <span className={clsx('rounded-full px-2 py-0.5 font-black', margin >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>
                      Margen ≈ {money(margin)}/u
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-black text-slate-600">Costo variable {money(variable)}</span>
                  </span>
                }
              />
              <NumberSlider
                label="Publicidad"
                help={HELP.advertising}
                prefix="$"
                value={decisions.marketing.advertising[product]}
                max={10_000}
                step={100}
                color={info.color}
                onChange={(value) => update((d) => void (d.marketing.advertising[product] = value))}
                hint={<span>Índice de marketing actual: <b className="text-slate-700">{ratio(data.snapshot.marketingIndex[product])}</b> (de 1 a 2)</span>}
              />
            </StepCard>
          )
        })}
      </div>

      <button
        onClick={() => update((d) => void (d.marketing.buyMarketResearch = !d.marketing.buyMarketResearch))}
        className={clsx(
          'flex w-full items-center gap-4 rounded-3xl p-5 text-left transition',
          research ? 'bg-pink-500 text-white shadow-lg' : 'card hover:ring-pink-300',
        )}
      >
        <span className="text-4xl">🔎</span>
        <span className="flex-1">
          <span className="block text-lg font-black">Estudio de mercado {research ? '✓' : ''}</span>
          <span className={clsx('block text-sm font-semibold', research ? 'text-white/85' : 'text-slate-500')}>{HELP.marketResearch}</span>
        </span>
        <span className={clsx('rounded-2xl px-3 py-1.5 text-sm font-black', research ? 'bg-white text-pink-600' : 'bg-pink-50 text-pink-600')}>
          {money(data.rules.costs.marketResearchCost)}
        </span>
      </button>

      <div className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-500 ring-1 ring-slate-100" style={{ borderLeft: `4px solid ${STEP_THEME.market.color}` }}>
        👥 El mercado tiene dos tipos de clientes: los que buscan <b className="text-slate-700">precio</b> (la mayoría) y los que buscan <b className="text-slate-700">calidad</b>. Cuando la economía
        empeora, más clientes buscan precio.
      </div>

      <IssueList errors={issues.errors} warnings={issues.warnings} />
    </>
  )
}
