import { NumberSlider } from '@/components/ui/NumberSlider'
import { Segmented } from '@/components/ui/Segmented'
import { Stat } from '@/components/ui/Stat'
import { STEP_THEME } from '@/lib/constants'
import { money, pct, units } from '@/lib/format'
import { HELP } from '@/lib/glossary'
import type { PrepaymentMode } from '@/lib/types'

import { IssueList } from './IssueList'
import { StepCard } from './StepCard'
import type { StepProps } from './step.types'

const frenchInstallment = (principal: number, rate: number, quarters: number): number =>
  principal <= 0 ? 0 : rate === 0 ? principal / quarters : (principal * rate) / (1 - Math.pow(1 + rate, -quarters))

export function FinanceStep({ data, decisions, update, validation, issues }: StepProps) {
  const p = validation?.projection
  const f = decisions.finance
  const rules = data.rules.finance
  const accent = STEP_THEME.finance.color
  const creditRoom = p?.creditRoom ?? 0
  const installment = frenchInstallment(f.longTermLoan, data.rules.longTermQuarterlyRate, rules.longTermQuarters)
  const netPerShare = (p?.shareIssuePrice ?? 0) * (1 - rules.issueCost)
  const longTermDebt = data.snapshot.debt.longTerm

  return (
    <>
      <StepCard title="Tu situación financiera" subtitle="Después de pagar las deudas que vencen al inicio del trimestre" emoji="🏦" accent={accent}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Caja disponible" value={money(p?.cashAfterDebtService)} tone={(p?.cashAfterDebtService ?? 0) < 0 ? 'bad' : 'default'} />
          <Stat label="Crédito disponible" value={money(creditRoom)} sub={`Deuda ≤ ${rules.creditLimitMultiple}× patrimonio`} />
          <Stat label="Deuda largo plazo" value={money(longTermDebt)} sub={longTermDebt > 0 ? `Cuota ${money(data.snapshot.debt.longTermInstallment)}` : undefined} />
          <Stat label="Caja estimada al cierre" value={money(p?.estimatedCashEnd)} tone={(p?.estimatedCashEnd ?? 0) < 0 ? 'bad' : 'good'} help={HELP.emergencyLoan} />
        </div>
        {data.snapshot.emergencyStreak > 0 && (
          <div className="rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-700 ring-1 ring-rose-200">
            🚨 Llevas {data.snapshot.emergencyStreak} trimestre(s) seguidos con préstamo de emergencia. Si llegas a 3, tu empresa quiebra.
          </div>
        )}
      </StepCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <StepCard title="Préstamos" emoji="💳" accent={accent}>
          <NumberSlider
            label={`Corto plazo (${pct(rules.shortTermRate, 0)} trimestral)`}
            help={HELP.shortTermLoan}
            prefix="$"
            value={f.shortTermLoan}
            max={Math.max(creditRoom, f.shortTermLoan, 1000)}
            step={500}
            color={accent}
            error={f.shortTermLoan + f.longTermLoan > creditRoom + 1}
            onChange={(value) => update((d) => void (d.finance.shortTermLoan = value))}
            hint={f.shortTermLoan > 0 ? <span>Devuelves {money(f.shortTermLoan * (1 + rules.shortTermRate))} el próximo trimestre.</span> : undefined}
          />
          <NumberSlider
            label={`Largo plazo (${pct(rules.longTermAnnualRate, 0)} anual, ${rules.longTermQuarters / 4} años)`}
            help={HELP.longTermLoan}
            prefix="$"
            value={f.longTermLoan}
            max={Math.max(creditRoom, f.longTermLoan, 1000)}
            step={1000}
            color={accent}
            error={f.shortTermLoan + f.longTermLoan > creditRoom + 1}
            onChange={(value) => update((d) => void (d.finance.longTermLoan = value))}
            hint={f.longTermLoan > 0 ? <span>Cuota fija ≈ {money(installment)} por trimestre durante {rules.longTermQuarters} trimestres.</span> : undefined}
          />
          {longTermDebt > 0 && (
            <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
              <NumberSlider
                label="Prepagar deuda de largo plazo"
                help={HELP.prepayment}
                prefix="$"
                value={f.prepayment.amount}
                max={Math.ceil(longTermDebt)}
                step={500}
                color={accent}
                onChange={(value) => update((d) => void (d.finance.prepayment.amount = value))}
              />
              {f.prepayment.amount > 0 && (
                <Segmented<PrepaymentMode>
                  value={f.prepayment.mode}
                  onChange={(mode) => update((d) => void (d.finance.prepayment.mode = mode))}
                  options={[
                    { value: 'REDUCE_INSTALLMENT', label: 'Bajar la cuota' },
                    { value: 'REDUCE_TERM', label: 'Acortar el plazo' },
                  ]}
                />
              )}
            </div>
          )}
        </StepCard>

        <StepCard title="Accionistas e inversiones" emoji="📈" accent={accent}>
          <NumberSlider
            label="Emitir acciones nuevas"
            help={HELP.sharesToIssue}
            value={f.sharesToIssue}
            max={Math.round(data.snapshot.shares * 0.5)}
            step={100}
            color={accent}
            disabled={!p?.shareIssueAllowed}
            onChange={(value) => update((d) => void (d.finance.sharesToIssue = value))}
            hint={
              p?.shareIssueAllowed ? (
                <span>
                  Precio de emisión ≈ ${p.shareIssuePrice.toFixed(2)} · Recibirías <b className="text-slate-700">{money(f.sharesToIssue * netPerShare)}</b> · Hoy hay {units(data.snapshot.shares)} acciones
                </span>
              ) : (
                <span className="text-rose-600">Tu acción vale menos que su valor nominal: no puedes emitir.</span>
              )
            }
          />
          <NumberSlider
            label="Pagar dividendos"
            help={HELP.dividends}
            prefix="$"
            value={f.dividends}
            max={Math.max(p?.maxDividends ?? 0, f.dividends, 0)}
            step={500}
            color={accent}
            disabled={(p?.maxDividends ?? 0) <= 0 && f.dividends === 0}
            error={f.dividends > (p?.maxDividends ?? 0) + 0.01}
            onChange={(value) => update((d) => void (d.finance.dividends = value))}
            hint={
              (p?.maxDividends ?? 0) > 0 ? (
                <span>Máximo {money(p?.maxDividends)} (tus utilidades retenidas) · {`$${(f.dividends / data.snapshot.shares).toFixed(3)}`} por acción</span>
              ) : (
                <span>Necesitas utilidades acumuladas para repartir dividendos.</span>
              )
            }
          />
          <NumberSlider
            label={`Invertir en valores (${pct(rules.securitiesRate, 1)} trimestral)`}
            help={HELP.securities}
            prefix="$"
            value={f.securitiesPurchase}
            max={Math.max(0, Math.round(p?.cashAfterDebtService ?? 0), f.securitiesPurchase)}
            step={1000}
            color={accent}
            onChange={(value) => update((d) => void (d.finance.securitiesPurchase = value))}
            hint={f.securitiesPurchase > 0 ? <span>Recuperas {money(f.securitiesPurchase * (1 + rules.securitiesRate))} el próximo trimestre.</span> : undefined}
          />
        </StepCard>
      </div>

      <IssueList errors={issues.errors} warnings={issues.warnings} />
    </>
  )
}
