import clsx from 'clsx'
import type { ReactNode } from 'react'

import { HelpTip } from '@/components/ui/HelpTip'
import { money, pct, ratio, units } from '@/lib/format'
import { CASH_CONCEPTS } from '@/lib/glossary'
import type { CycleReport } from '@/lib/types'

interface RowProps {
  label: ReactNode
  values: (number | null)[]
  level?: 0 | 1 | 2
  total?: boolean
  negative?: boolean
  format?: (value: number | null) => string
}

function Row({ label, values, level = 0, total, negative, format = money }: RowProps) {
  return (
    <tr className={clsx(total ? 'border-t-2 border-slate-200 font-black' : 'font-semibold', total && 'bg-slate-50/70')}>
      <td className={clsx('py-1.5 pr-3 text-slate-700', level === 1 && 'pl-4', level === 2 && 'pl-8 text-slate-500')}>{label}</td>
      {values.map((value, index) => (
        <td
          key={index}
          className={clsx('py-1.5 pl-3 text-right tabular-nums', value !== null && value < 0 ? 'text-rose-600' : total ? 'text-slate-900' : 'text-slate-600')}
        >
          {value === null ? '' : negative && value !== 0 ? `(${format(Math.abs(value))})` : format(value)}
        </td>
      ))}
    </tr>
  )
}

function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-sm">
        <thead>
          <tr className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            {headers.map((header, index) => (
              <th key={header} className={clsx('pb-2', index === 0 ? 'text-left' : 'pl-3 text-right')}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function IncomeStatementTable({ report }: { report: CycleReport }) {
  const is = report.incomeStatement
  const opex = is.operatingExpenses
  const fin = is.financialExpenses
  return (
    <Table headers={['Estado de resultados', 'A', 'B', 'Total']}>
      <Row label="Ventas" values={[is.revenue.A, is.revenue.B, is.revenue.total]} />
      <Row label="Costo de ventas" values={[is.costOfSales.A, is.costOfSales.B, is.costOfSales.total]} negative />
      <Row label="Utilidad bruta" values={[null, null, is.grossProfit]} total />
      <Row label="Publicidad" values={[null, null, opex.marketing]} level={1} negative />
      <Row label="Mejora de calidad (I+D)" values={[null, null, opex.qualityImprovement]} level={1} negative />
      <Row label="Estudio de mercado" values={[null, null, opex.marketResearch]} level={1} negative />
      <Row label="Gastos administrativos" values={[null, null, opex.administrative]} level={1} negative />
      <Row label="Almacenaje" values={[null, null, opex.holding]} level={1} negative />
      <Row
        label={
          <span className="inline-flex items-center gap-1">
            Capacidad ociosa <HelpTip text="La parte de la depreciación de tu planta que no se usó para producir. Es el costo de tener planta parada." />
          </span>
        }
        values={[null, null, opex.idleCapacity]}
        level={1}
        negative
      />
      <Row label="Utilidad operativa (EBIT)" values={[null, null, is.ebit]} total />
      <Row label="Ingresos financieros" values={[null, null, is.financialIncome]} level={1} />
      <Row label="Intereses corto plazo" values={[null, null, fin.shortTerm]} level={1} negative />
      <Row label="Intereses largo plazo" values={[null, null, fin.longTerm]} level={1} negative />
      <Row label="Intereses de emergencia" values={[null, null, fin.emergency]} level={1} negative />
      {fin.prepaymentPenalty > 0 && <Row label="Penalidad por prepago" values={[null, null, fin.prepaymentPenalty]} level={1} negative />}
      <Row label="Utilidad antes de impuestos" values={[null, null, is.ebt]} total />
      {is.taxLossUsed > 0 && <Row label="Pérdidas compensadas" values={[null, null, is.taxLossUsed]} level={2} />}
      <Row label="Impuesto a la renta" values={[null, null, is.tax]} level={1} negative />
      <Row label="Utilidad neta" values={[null, null, is.netIncome]} total />
      <Row label="EBITDA (informativo)" values={[null, null, is.ebitda]} level={2} />
    </Table>
  )
}

export function BalanceSheetTable({ report }: { report: CycleReport }) {
  const { assets, liabilities, equity } = report.balanceSheet
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Table headers={['Activo', 'Monto']}>
        <Row label="Caja" values={[assets.cash]} level={1} />
        <Row label="Valores negociables" values={[assets.securities + assets.securitiesYieldReceivable]} level={1} />
        <Row label="Producto terminado A" values={[assets.finishedGoods.A]} level={1} />
        <Row label="Producto terminado B" values={[assets.finishedGoods.B]} level={1} />
        <Row label="Materia prima A" values={[assets.materials.A]} level={1} />
        <Row label="Materia prima B" values={[assets.materials.B]} level={1} />
        <Row label="Materia prima en tránsito" values={[assets.materialsInTransit]} level={1} />
        <Row label="Activo corriente" values={[assets.currentTotal]} total />
        <Row label="Planta (costo)" values={[assets.fixedGross]} level={1} />
        <Row label="Depreciación acumulada" values={[assets.accumulatedDepreciation]} level={1} negative />
        <Row label="Ampliación en curso" values={[assets.inProgress]} level={1} />
        <Row label="Activo no corriente" values={[assets.nonCurrentTotal]} total />
        <Row label="TOTAL ACTIVO" values={[assets.total]} total />
      </Table>
      <Table headers={['Pasivo y patrimonio', 'Monto']}>
        <Row label="Préstamo corto plazo" values={[liabilities.shortTermLoan]} level={1} />
        <Row label="Intereses por pagar" values={[liabilities.shortTermInterest + liabilities.longTermInterest]} level={1} />
        <Row label="Préstamo de emergencia" values={[liabilities.emergencyLoan]} level={1} />
        <Row label="Porción corriente largo plazo" values={[liabilities.longTermCurrent]} level={1} />
        <Row label="Pasivo corriente" values={[liabilities.currentTotal]} total />
        <Row label="Deuda largo plazo" values={[liabilities.longTermNonCurrent]} level={1} />
        <Row label="Total pasivo" values={[liabilities.total]} total />
        <Row label="Capital social" values={[equity.shareCapital]} level={1} />
        <Row label="Capital adicional" values={[equity.additionalCapital]} level={1} />
        {equity.legalReserve > 0 && <Row label="Reserva legal" values={[equity.legalReserve]} level={1} />}
        <Row label="Utilidades retenidas" values={[equity.retainedEarnings]} level={1} />
        <Row label="Total patrimonio" values={[equity.total]} total />
        <Row label="TOTAL PASIVO + PATRIMONIO" values={[report.balanceSheet.totalLiabilitiesAndEquity]} total />
      </Table>
    </div>
  )
}

export function CashFlowTable({ report }: { report: CycleReport }) {
  const flow = report.cashFlow
  const section = (category: 'OPERATING' | 'INVESTING' | 'FINANCING') => flow.moves.filter((move) => move.category === category)
  const block = (title: string, category: 'OPERATING' | 'INVESTING' | 'FINANCING', subtotal: number) => (
    <>
      <tr>
        <td colSpan={2} className="pt-3 text-xs font-black uppercase tracking-wider text-slate-400">
          {title}
        </td>
      </tr>
      {section(category).map((move, index) => (
        <Row key={`${move.concept}-${index}`} label={CASH_CONCEPTS[move.concept] ?? move.concept} values={[move.amount]} level={1} />
      ))}
      <Row label={`Flujo de ${title.toLowerCase()}`} values={[subtotal]} total />
    </>
  )
  return (
    <Table headers={['Flujo de caja (método directo)', 'Monto']}>
      <Row label="Caja inicial" values={[flow.opening]} total />
      {block('Operación', 'OPERATING', flow.operating)}
      {block('Inversión', 'INVESTING', flow.investing)}
      {block('Financiamiento', 'FINANCING', flow.financing)}
      <Row label="Caja final" values={[flow.closing]} total />
    </Table>
  )
}

export function IndicatorsGrid({ report }: { report: CycleReport }) {
  const i = report.indicators
  const groups: { title: string; items: { label: string; value: string; help?: string; tone?: 'good' | 'bad' }[] }[] = [
    {
      title: 'Liquidez',
      items: [
        { label: 'Liquidez corriente', value: ratio(i.currentRatio), help: 'Activo corriente ÷ pasivo corriente. Más de 1 significa que puedes pagar tus deudas de corto plazo.' },
        { label: 'Prueba ácida', value: ratio(i.quickRatio), help: 'Como la liquidez corriente, pero sin contar inventarios.' },
        { label: 'Capital de trabajo', value: money(i.workingCapital) },
      ],
    },
    {
      title: 'Endeudamiento',
      items: [
        { label: 'Deuda / patrimonio', value: ratio(i.debtToEquity) },
        { label: 'Pasivo / activo', value: pct(i.debtToAssets) },
        { label: 'Cobertura de intereses', value: ratio(i.interestCoverage, 1), help: 'Cuántas veces tu utilidad operativa cubre los intereses.' },
      ],
    },
    {
      title: 'Rentabilidad',
      items: [
        { label: 'Margen bruto', value: pct(i.grossMargin) },
        { label: 'Margen operativo', value: pct(i.operatingMargin) },
        { label: 'Margen neto', value: pct(i.netMargin), tone: (i.netMargin ?? 0) >= 0 ? 'good' : 'bad' },
        { label: 'ROE anualizado', value: pct(i.roeAnnual), help: 'Utilidad de los últimos 4 trimestres ÷ patrimonio promedio. El mercado exige 15%.' },
        { label: 'ROA trimestral', value: pct(i.roa) },
        { label: 'ROI acumulado', value: pct(i.roi) },
      ],
    },
    {
      title: 'Operación',
      items: [
        { label: 'Uso de planta', value: pct(i.capacityUtilization, 0) },
        { label: 'Rotación de inventario', value: ratio(i.inventoryTurnover, 1) },
        { label: 'Días de inventario', value: i.inventoryDays === null ? '—' : `${Math.round(i.inventoryDays)} días` },
        { label: 'Punto de equilibrio', value: i.breakEvenUnits === null ? '—' : `${units(i.breakEvenUnits)} u`, help: 'Unidades que necesitas vender para no perder, con tu mezcla actual de productos.' },
        { label: 'Margen contribución A', value: money(i.contributionMarginPerUnit.A) },
        { label: 'Margen contribución B', value: money(i.contributionMarginPerUnit.B) },
      ],
    },
    {
      title: 'Bolsa',
      items: [
        { label: 'Precio de la acción', value: `$${i.sharePrice.toFixed(2)}` },
        { label: 'Valor en libros / acción', value: `$${i.bookValuePerShare.toFixed(2)}` },
        { label: 'Utilidad por acción', value: `$${i.eps.toFixed(3)}` },
        { label: 'Precio / valor libros', value: ratio(i.priceToBook) },
        { label: 'Dividendo por acción', value: `$${i.dividendsPerShare.toFixed(3)}` },
        { label: 'Retorno accionista (TSR)', value: pct(i.tsr), tone: i.tsr >= 0 ? 'good' : 'bad' },
      ],
    },
  ]
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {groups.map((group) => (
        <div key={group.title} className="rounded-2xl bg-slate-50 p-4">
          <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">{group.title}</p>
          <dl className="space-y-1.5">
            {group.items.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-2 text-sm">
                <dt className="flex items-center gap-1 font-semibold text-slate-600">
                  {item.label} {item.help && <HelpTip text={item.help} title={item.label} />}
                </dt>
                <dd className={clsx('font-black tabular-nums', item.tone === 'good' && 'text-emerald-600', item.tone === 'bad' && 'text-rose-600')}>{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  )
}

export function OperationsTable({ report }: { report: CycleReport }) {
  const ops = report.operations
  return (
    <Table headers={['Operación', 'A', 'B']}>
      <Row label="Precio" values={[ops.price.A, ops.price.B]} />
      <Row label="Demanda" values={[ops.demand.A, ops.demand.B]} format={units} />
      <Row label="Ventas (unidades)" values={[ops.sales.A, ops.sales.B]} format={units} />
      <Row label="Ventas perdidas por falta de stock" values={[ops.lostSales.A, ops.lostSales.B]} format={units} />
      <Row label="Participación de mercado" values={[ops.marketShare.A, ops.marketShare.B]} format={(v) => pct(v)} />
      <Row label="Producción" values={[ops.production.A, ops.production.B]} format={units} />
      <Row label="Costo unitario" values={[ops.unitCost.A, ops.unitCost.B]} format={(v) => (v === null ? '' : `$${v.toFixed(2)}`)} />
      <Row label="Inventario final PT" values={[ops.finishedGoods.A.final, ops.finishedGoods.B.final]} format={units} />
      <Row label="Materia prima final" values={[ops.materials.A.final, ops.materials.B.final]} format={units} />
      <Row label="Materia prima en camino" values={[ops.materials.A.inTransit, ops.materials.B.inTransit]} format={units} />
      <Row label="Índice de calidad" values={[ops.qualityIndex.A, ops.qualityIndex.B]} format={(v) => ratio(v)} />
      <Row label="Índice de marketing" values={[ops.marketingIndex.A, ops.marketingIndex.B]} format={(v) => ratio(v)} />
    </Table>
  )
}
