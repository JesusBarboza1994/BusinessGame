import clsx from 'clsx'
import { CircleAlert, CloudCheck, Loader2, TriangleAlert } from 'lucide-react'

import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { PRODUCT_INFO, PRODUCTS } from '@/lib/constants'
import { money, units } from '@/lib/format'
import type { DecisionValidation } from '@/lib/types'

export function ProjectionPanel({ validation, saving, onReview }: { validation: DecisionValidation | null; saving: 'idle' | 'saving' | 'saved' | 'error'; onReview: () => void }) {
  if (!validation) return null
  const p = validation.projection
  const cashTone = p.estimatedCashEnd < 0 ? 'text-rose-600' : 'text-emerald-600'
  return (
    <div className="card space-y-5 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-slate-800">Proyección del trimestre</h3>
        <SaveState saving={saving} />
      </div>

      <div className="rounded-2xl bg-slate-50 p-4 text-center">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400">Caja estimada al cierre</p>
        <p className={clsx('mt-1 text-3xl font-black', cashTone)}>
          <AnimatedNumber value={p.estimatedCashEnd} format={money} duration={0.4} />
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-left text-xs font-bold">
          <div className="rounded-xl bg-white p-2">
            <p className="text-slate-400">Ventas estimadas</p>
            <p className="text-sm font-black text-emerald-600">+{money(p.estimatedRevenue)}</p>
          </div>
          <div className="rounded-xl bg-white p-2">
            <p className="text-slate-400">Gastos e inversiones</p>
            <p className="text-sm font-black text-rose-600">-{money(p.estimatedSpending)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {PRODUCTS.map((product) => {
          const demand = p.estimatedDemand[product]
          const available = p.finishedGoodsAvailable[product]
          const max = Math.max(demand, available, 1)
          return (
            <div key={product}>
              <div className="flex justify-between text-xs font-black">
                <span style={{ color: PRODUCT_INFO[product].color }}>
                  {PRODUCT_INFO[product].emoji} {PRODUCT_INFO[product].name}
                </span>
                <span className={available < demand ? 'text-amber-600' : 'text-slate-500'}>
                  {units(available)} disp. / {units(demand)} demanda
                </span>
              </div>
              <div className="relative mt-1 h-3 rounded-full bg-slate-100">
                <div className="absolute inset-y-0 left-0 rounded-full transition-all" style={{ width: `${(available / max) * 100}%`, backgroundColor: PRODUCT_INFO[product].color }} />
                <div className="absolute inset-y-[-3px] w-1 rounded bg-slate-800" style={{ left: `${(demand / max) * 100}%` }} title="Demanda estimada" />
              </div>
            </div>
          )
        })}
        <p className="text-[11px] font-semibold leading-snug text-slate-400">La demanda real depende de lo que hagan tus competidores. La línea negra es nuestra estimación.</p>
      </div>

      <div>
        <div className="flex justify-between text-xs font-black text-slate-500">
          <span>Uso de planta</span>
          <span>{Math.round(p.capacityUtilization * 100)}%</span>
        </div>
        <div className="mt-1 h-3 rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${Math.min(100, p.capacityUtilization * 100)}%` }} />
        </div>
      </div>

      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <button onClick={onReview} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-50 py-2.5 text-sm font-black hover:bg-slate-100">
          {validation.errors.length > 0 && (
            <span className="flex items-center gap-1 text-rose-600">
              <CircleAlert className="size-4" /> {validation.errors.length} error{validation.errors.length > 1 ? 'es' : ''}
            </span>
          )}
          {validation.warnings.length > 0 && (
            <span className="flex items-center gap-1 text-amber-600">
              <TriangleAlert className="size-4" /> {validation.warnings.length} aviso{validation.warnings.length > 1 ? 's' : ''}
            </span>
          )}
        </button>
      )}
    </div>
  )
}

function SaveState({ saving }: { saving: 'idle' | 'saving' | 'saved' | 'error' }) {
  if (saving === 'saving')
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-slate-400">
        <Loader2 className="size-3 animate-spin" /> Guardando
      </span>
    )
  if (saving === 'saved')
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-emerald-500">
        <CloudCheck className="size-3.5" /> Borrador guardado
      </span>
    )
  if (saving === 'error') return <span className="text-xs font-bold text-rose-500">Sin conexión</span>
  return null
}
