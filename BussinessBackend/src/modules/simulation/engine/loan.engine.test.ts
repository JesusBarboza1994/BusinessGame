import { createLongTermLoan, payInstallment, prepayLoan, quarterlyRateFromAnnual } from './loan.engine'

import { PrepaymentMode } from './engine.types'

describe('loan engine (French system)', () => {
  const rate = quarterlyRateFromAnnual(0.5)

  it('matches the spreadsheet interest for a 6,000 five-year loan', () => {
    const loan = createLongTermLoan('L1', 1, 6000, rate, 20)
    const first = payInstallment(loan)

    expect(rate).toBeCloseTo(0.10668, 5)
    expect(loan.installment).toBeCloseTo(737.17, 2)
    expect(first.interestPaid).toBeCloseTo(640.1, 1)
  })

  it('fully amortizes after all installments', () => {
    let loan = createLongTermLoan('L1', 1, 10000, rate, 20)
    for (let i = 0; i < 20; i++) loan = payInstallment(loan).loan

    expect(loan.balance).toBeCloseTo(0, 6)
  })

  it('reduces the installment or the term on prepayment', () => {
    const loan = createLongTermLoan('L1', 1, 10000, rate, 20)
    const lowerInstallment = prepayLoan(loan, 4000, PrepaymentMode.REDUCE_INSTALLMENT)
    const shorterTerm = prepayLoan(loan, 4000, PrepaymentMode.REDUCE_TERM)

    expect(lowerInstallment.installment).toBeLessThan(loan.installment)
    expect(lowerInstallment.remainingQuarters).toBe(20)
    expect(shorterTerm.remainingQuarters).toBeLessThan(20)
    expect(shorterTerm.installment).toBeLessThanOrEqual(loan.installment + 1e-6)
  })
})
