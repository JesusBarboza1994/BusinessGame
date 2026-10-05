import { LongTermLoan, PrepaymentMode } from './engine.types'

export const quarterlyRateFromAnnual = (annualRate: number): number => Math.pow(1 + annualRate, 1 / 4) - 1

export function frenchInstallment(balance: number, rate: number, quarters: number): number {
  if (balance <= 0 || quarters <= 0) return 0
  if (rate === 0) return balance / quarters
  return (balance * rate) / (1 - Math.pow(1 + rate, -quarters))
}

export function createLongTermLoan(id: string, cycle: number, principal: number, rate: number, quarters: number): LongTermLoan {
  return {
    id,
    originCycle: cycle,
    principal,
    balance: principal,
    rate,
    remainingQuarters: quarters,
    installment: frenchInstallment(principal, rate, quarters),
  }
}

// Pays one installment: interest accrued last cycle plus the principal part
export function payInstallment(loan: LongTermLoan): { loan: LongTermLoan; principalPaid: number; interestPaid: number } {
  const interestPaid = loan.balance * loan.rate
  const isLast = loan.remainingQuarters <= 1
  const principalPaid = isLast ? loan.balance : Math.min(loan.balance, loan.installment - interestPaid)
  return {
    loan: { ...loan, balance: loan.balance - principalPaid, remainingQuarters: Math.max(0, loan.remainingQuarters - 1) },
    principalPaid,
    interestPaid,
  }
}

export function prepayLoan(loan: LongTermLoan, amount: number, mode: PrepaymentMode): LongTermLoan {
  const balance = Math.max(0, loan.balance - amount)
  if (balance < 1e-6) return { ...loan, balance: 0, remainingQuarters: 0, installment: 0 }
  if (mode === PrepaymentMode.REDUCE_INSTALLMENT) {
    return { ...loan, balance, installment: frenchInstallment(balance, loan.rate, loan.remainingQuarters) }
  }
  const ratio = (balance * loan.rate) / loan.installment
  const quarters = loan.rate === 0 ? Math.ceil(balance / loan.installment) : Math.ceil(-Math.log(1 - ratio) / Math.log(1 + loan.rate))
  const remainingQuarters = Math.max(1, Math.min(loan.remainingQuarters, quarters))
  return { ...loan, balance, remainingQuarters, installment: frenchInstallment(balance, loan.rate, remainingQuarters) }
}

// Principal that falls due within the next `horizon` installments (current portion)
export function principalDueWithin(loan: LongTermLoan, horizon: number): number {
  let current = loan
  let due = 0
  for (let i = 0; i < horizon && current.balance > 1e-6; i++) {
    const paid = payInstallment(current)
    due += paid.principalPaid
    current = paid.loan
  }
  return due
}
