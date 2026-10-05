import clsx from 'clsx'
import { CircleCheck, Pencil, Rocket } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { STEP_THEME, type StepId } from '@/lib/constants'
import { money, units } from '@/lib/format'

import { IssueList } from './IssueList'
import type { StepProps } from './step.types'
import { stepOfField } from './step.utils'

interface Props extends StepProps {
  onGo: (step: StepId) => void
  onSubmit: () => void
  submitting: boolean
  submitError: string | null
}

export function ReviewStep({ decisions: d, validation, onGo, onSubmit, submitting, submitError, data }: Props) {
  const errors = validation?.errors ?? []
  const warnings = validation?.warnings ?? []
  const p = validation?.projection
  const cards: { step: StepId; lines: [string, string][] }[] = [
    {
      step: 'production',
      lines: [
        ['Producir A / B', `${units(d.production.units.A)} / ${units(d.production.units.B)} u`],
        ['Comprar materia prima A / B', `${units(d.production.materialPurchases.A)} / ${units(d.production.materialPurchases.B)} u`],
        ['Módulos de planta', `${d.production.capacityModules}`],
      ],
    },
    {
      step: 'market',
      lines: [
        ['Precio A / B', `${money(d.marketing.price.A)} / ${money(d.marketing.price.B)}`],
        ['Publicidad A / B', `${money(d.marketing.advertising.A)} / ${money(d.marketing.advertising.B)}`],
        ['Estudio de mercado', d.marketing.buyMarketResearch ? 'Sí' : 'No'],
      ],
    },
    {
      step: 'research',
      lines: [['Mejora de calidad A / B', `${money(d.research.quality.A)} / ${money(d.research.quality.B)}`]],
    },
    {
      step: 'finance',
      lines: [
        ['Préstamos CP / LP', `${money(d.finance.shortTermLoan)} / ${money(d.finance.longTermLoan)}`],
        ['Acciones / Dividendos', `${units(d.finance.sharesToIssue)} / ${money(d.finance.dividends)}`],
        ['Valores negociables', money(d.finance.securitiesPurchase)],
      ],
    },
  ]

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => {
          const theme = STEP_THEME[card.step]
          const hasError = errors.some((issue) => stepOfField(issue.field) === card.step)
          return (
            <div key={card.step} className={clsx('card p-4', hasError && 'ring-2 ring-rose-300')}>
              <div className="mb-2 flex items-center justify-between">
                <p className="font-black" style={{ color: theme.color }}>
                  {theme.emoji} {theme.label}
                </p>
                <button onClick={() => onGo(card.step)} className="flex items-center gap-1 text-xs font-black text-slate-400 hover:text-brand-600">
                  <Pencil className="size-3" /> Editar
                </button>
              </div>
              <dl className="space-y-1 text-sm">
                {card.lines.map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-2">
                    <dt className="font-semibold text-slate-500">{label}</dt>
                    <dd className="font-black text-slate-800">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )
        })}
      </div>

      <div className="space-y-2">
        <IssueList errors={errors} warnings={warnings} />
        {errors.length === 0 && (
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2.5 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200">
            <CircleCheck className="size-4" /> Todo es factible. {warnings.length ? 'Revisa los avisos, pero puedes enviar.' : '¡Listo para enviar!'}
          </div>
        )}
      </div>

      <div className="card flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
        <div className="flex-1">
          <p className="text-sm font-black uppercase tracking-wider text-slate-400">Trimestre {data.game.currentCycle}</p>
          <p className="text-lg font-black text-slate-800">
            Caja estimada al cierre: <span className={(p?.estimatedCashEnd ?? 0) < 0 ? 'text-rose-600' : 'text-emerald-600'}>{money(p?.estimatedCashEnd)}</span>
          </p>
          <p className="text-xs font-semibold text-slate-500">Podrás cambiar tus decisiones hasta que cierre el trimestre.</p>
          {submitError && <p className="mt-2 text-sm font-bold text-rose-600">{submitError}</p>}
        </div>
        <Button variant="success" size="xl" disabled={errors.length > 0} loading={submitting} onClick={onSubmit} icon={<Rocket className="size-6" />}>
          Enviar decisiones
        </Button>
      </div>
    </>
  )
}
