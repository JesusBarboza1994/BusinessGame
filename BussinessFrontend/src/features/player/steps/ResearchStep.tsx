import { motion } from 'framer-motion'

import { NumberSlider } from '@/components/ui/NumberSlider'
import { PRODUCT_INFO, PRODUCTS } from '@/lib/constants'
import { money, ratio } from '@/lib/format'
import { HELP } from '@/lib/glossary'

import { IssueList } from './IssueList'
import { StepCard } from './StepCard'
import type { StepProps } from './step.types'

const MAX_INDEX = 3.5

export function ResearchStep({ data, decisions, update, issues }: StepProps) {
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-2">
        {PRODUCTS.map((product) => {
          const info = PRODUCT_INFO[product]
          const quality = data.snapshot.qualityIndex[product]
          return (
            <StepCard key={product} title={info.name} subtitle={product === 'A' ? 'A sus clientes les importa más el precio' : 'Sus clientes pagan por calidad'} emoji={info.emoji} accent={info.color}>
              <div>
                <div className="flex items-end justify-between">
                  <span className="text-sm font-black text-slate-600">Calidad percibida actual</span>
                  <span className="text-2xl font-black" style={{ color: info.color }}>
                    {ratio(quality)}
                  </span>
                </div>
                <div className="mt-2 h-4 overflow-hidden rounded-full bg-slate-100">
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: info.color }} initial={{ width: 0 }} animate={{ width: `${(quality / MAX_INDEX) * 100}%` }} />
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-400">Sube con lo que inviertes y baja 25% cada trimestre si dejas de invertir.</p>
              </div>
              <NumberSlider
                label="Inversión en mejora de calidad"
                help={HELP.quality}
                prefix="$"
                value={decisions.research.quality[product]}
                max={10_000}
                step={100}
                color={info.color}
                onChange={(value) => update((d) => void (d.research.quality[product] = value))}
                hint={<span>Se registra como gasto del trimestre: {money(decisions.research.quality[product])}</span>}
              />
            </StepCard>
          )
        })}
      </div>
      <IssueList errors={issues.errors} warnings={issues.warnings} />
    </>
  )
}
