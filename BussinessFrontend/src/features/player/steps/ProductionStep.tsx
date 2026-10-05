import clsx from 'clsx'
import { motion } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'

import { HelpTip } from '@/components/ui/HelpTip'
import { NumberSlider } from '@/components/ui/NumberSlider'
import { PRODUCT_INFO, PRODUCTS, STEP_THEME } from '@/lib/constants'
import { money, units } from '@/lib/format'
import { HELP } from '@/lib/glossary'

import { IssueList } from './IssueList'
import { StepCard } from './StepCard'
import type { StepProps } from './step.types'

export function ProductionStep({ data, decisions, update, validation, issues }: StepProps) {
  const p = validation?.projection
  const capacity = p?.capacity ?? data.snapshot.capacity
  const usage = PRODUCTS.reduce((acc, product) => acc + decisions.production.units[product] * data.rules.production.capacityUsage[product], 0)
  const over = usage > capacity
  const moduleCost = data.rules.production.moduleUnits * data.rules.production.moduleCostPerUnit
  const accent = STEP_THEME.production.color

  return (
    <>
      <StepCard title="Tu planta este trimestre" subtitle="Reparte tu capacidad entre los dos productos" emoji="🏭" accent={accent}>
        <div>
          <div className="mb-2 flex items-end justify-between">
            <span className="text-sm font-black text-slate-600">Capacidad usada</span>
            <span className={clsx('text-lg font-black', over ? 'text-rose-600' : 'text-slate-800')}>
              {units(usage)} <span className="text-sm text-slate-400">/ {units(capacity)} u</span>
            </span>
          </div>
          <div className="flex h-8 overflow-hidden rounded-2xl bg-slate-100 ring-2 ring-inset ring-slate-200">
            {PRODUCTS.map((product) => {
              const width = (decisions.production.units[product] / Math.max(capacity, usage)) * 100
              return (
                <motion.div
                  key={product}
                  layout
                  className="flex items-center justify-center text-xs font-black text-white"
                  style={{ width: `${width}%`, backgroundColor: PRODUCT_INFO[product].color }}
                >
                  {width > 12 && `${product} · ${units(decisions.production.units[product])}`}
                </motion.div>
              )
            })}
          </div>
          {over && <p className="mt-2 text-sm font-bold text-rose-600">Te pasaste de la capacidad por {units(usage - capacity)} unidades.</p>}
          {data.snapshot.capacityPending > 0 && <p className="mt-2 text-xs font-bold text-emerald-600">+{units(data.snapshot.capacityPending)} u de capacidad llegan el próximo trimestre.</p>}
        </div>
      </StepCard>

      <div className="grid gap-4 xl:grid-cols-2">
        {PRODUCTS.map((product) => {
          const info = PRODUCT_INFO[product]
          const materials = p?.materialsAvailable[product] ?? data.snapshot.materials[product]
          const stock = data.snapshot.finishedGoods[product]
          const demand = p?.estimatedDemand[product] ?? 0
          const suggested = Math.max(0, demand - stock)
          const units_ = decisions.production.units[product]
          return (
            <StepCard key={product} title={info.name} subtitle={info.tagline} emoji={info.emoji} accent={info.color}>
              <NumberSlider
                label="Unidades a producir"
                help={HELP.productionUnits}
                value={units_}
                max={Math.max(capacity, materials)}
                step={10}
                color={info.color}
                marker={suggested > 0 ? { value: suggested, label: 'Sugerido' } : undefined}
                error={units_ > materials}
                onChange={(value) => update((d) => void (d.production.units[product] = value))}
                hint={
                  <span>
                    Materia prima: <b className={units_ > materials ? 'text-rose-600' : 'text-slate-700'}>{units(materials)}</b> · En bodega: <b className="text-slate-700">{units(stock)}</b> · Costo ≈{' '}
                    <b className="text-slate-700">{money(p?.estimatedUnitCost[product] ?? 0)}/u</b>
                  </span>
                }
              />
              <NumberSlider
                label="Comprar materia prima (llega el próximo trimestre)"
                help={HELP.materialPurchases}
                value={decisions.production.materialPurchases[product]}
                max={Math.max(capacity * 1.5, 1500)}
                step={10}
                color={info.color}
                marker={{ value: units_, label: 'Repetir' }}
                onChange={(value) => update((d) => void (d.production.materialPurchases[product] = value))}
                hint={
                  <span>
                    Costo: <b className="text-slate-700">{money(decisions.production.materialPurchases[product] * data.rules.production.materialCost[product])}</b> (
                    {money(data.rules.production.materialCost[product])}/u)
                  </span>
                }
              />
            </StepCard>
          )
        })}
      </div>

      <StepCard title="Ampliar la planta" subtitle="Inversión de largo plazo" emoji="🏗️" accent={accent} right={<HelpTip text={HELP.capacityModules} />}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-1.5">
            <button
              onClick={() => update((d) => void (d.production.capacityModules = Math.max(0, d.production.capacityModules - 1)))}
              className="flex size-10 items-center justify-center rounded-xl bg-white font-black shadow-sm disabled:opacity-40"
              disabled={decisions.production.capacityModules === 0}
              aria-label="Quitar módulo"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-10 text-center text-2xl font-black">{decisions.production.capacityModules}</span>
            <button
              onClick={() => update((d) => void (d.production.capacityModules = Math.min(5, d.production.capacityModules + 1)))}
              className="flex size-10 items-center justify-center rounded-xl bg-white font-black shadow-sm"
              aria-label="Agregar módulo"
            >
              <Plus className="size-4" />
            </button>
          </div>
          <div className="text-sm font-semibold text-slate-600">
            {decisions.production.capacityModules === 0 ? (
              <>Cada módulo suma {units(data.rules.production.moduleUnits)} u de capacidad y cuesta {money(moduleCost)}.</>
            ) : (
              <>
                Inviertes <b className="text-slate-800">{money(decisions.production.capacityModules * moduleCost)}</b>. Tu planta pasará de {units(capacity + data.snapshot.capacityPending)} a{' '}
                <b className="text-emerald-600">{units(capacity + data.snapshot.capacityPending + decisions.production.capacityModules * data.rules.production.moduleUnits)} u</b> el próximo
                trimestre.
              </>
            )}
          </div>
        </div>
      </StepCard>

      <IssueList errors={issues.errors} warnings={issues.warnings} />
    </>
  )
}
