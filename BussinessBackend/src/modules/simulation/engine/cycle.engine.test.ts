import { createInitialCompanyState, totalEquity } from './company.engine'
import { defaultDecisions } from './decisions.engine'

import { mockSettings, randomStrategy, simulate } from './mocks/engine.mock'

import { CompanyStatus, ValuationMethod } from './engine.types'

describe('runCycle', () => {
  it('starts with a balanced company worth its contributed capital', () => {
    const settings = mockSettings()
    const state = createInitialCompanyState(settings, ValuationMethod.WEIGHTED_AVERAGE)

    expect(totalEquity(state)).toBe(159_000)
    expect(state.sharePrice).toBe(10)
  })

  it('keeps assets = liabilities + equity and cash flow coherent under random decisions', () => {
    const settings = mockSettings({ cycles: 12, seed: 7 })
    const strategies = Object.fromEntries([1, 2, 3, 4, 5].map((n) => [`c${n}`, randomStrategy(100 + n)]))
    const { outputs } = simulate(settings, strategies, { c2: ValuationMethod.FIFO, c4: ValuationMethod.FIFO })

    for (const output of outputs) {
      for (const company of output.companies) {
        if (!company.report) continue
        const { balanceSheet, cashFlow } = company.report
        expect(balanceSheet.balanced, `${company.id} cycle ${output.marketResult.cycle}`).toBe(true)
        const flow = cashFlow.opening + cashFlow.operating + cashFlow.investing + cashFlow.financing
        expect(Math.abs(flow - cashFlow.closing)).toBeLessThan(0.01)
        expect(cashFlow.closing).toBeGreaterThanOrEqual(-0.01)
      }
    }
  })

  it('never sells more than available and shares add up to one', () => {
    const settings = mockSettings({ cycles: 6, seed: 3 })
    const strategies = Object.fromEntries([1, 2, 3].map((n) => [`c${n}`, randomStrategy(n)]))
    const { outputs } = simulate(settings, strategies)

    for (const output of outputs) {
      const totalShare = output.marketResult.offerings.reduce((acc, o) => acc + o.share, 0)
      if (output.marketResult.offerings.some((o) => o.sales > 0)) expect(totalShare).toBeCloseTo(1, 6)
      for (const company of output.companies) {
        const ops = company.report?.operations
        if (!ops) continue
        for (const p of ['A', 'B'] as const) {
          expect(ops.sales[p]).toBeLessThanOrEqual(ops.finishedGoods[p].initial + ops.production[p])
          expect(ops.finishedGoods[p].final).toBeGreaterThanOrEqual(0)
        }
      }
    }
  })

  it('is deterministic for the same seed', () => {
    const settings = mockSettings({ cycles: 4, seed: 42 })
    const run = () => simulate(settings, { a: randomStrategy(1), b: randomStrategy(2) })

    expect(JSON.stringify(run().outputs)).toBe(JSON.stringify(run().outputs))
  })

  it('gives more demand to the cheaper offer, all else equal', () => {
    const settings = mockSettings({ cycles: 1, seed: 5 })
    settings.market.noiseSigma = 0
    const cheap = (_c: number, state: Parameters<typeof defaultDecisions>[1], s: typeof settings) => {
      const d = defaultDecisions(s, state)
      d.marketing.price = { A: 25, B: 35 }
      return d
    }
    const expensive = (_c: number, state: Parameters<typeof defaultDecisions>[1], s: typeof settings) => {
      const d = defaultDecisions(s, state)
      d.marketing.price = { A: 35, B: 45 }
      return d
    }
    const { outputs } = simulate(settings, { cheap, expensive })
    const offer = (id: string, p: string) => outputs[0].marketResult.offerings.find((o) => o.companyId === id && o.product === p)!

    expect(offer('cheap', 'A').demand).toBeGreaterThan(offer('expensive', 'A').demand)
    expect(offer('cheap', 'B').demand).toBeGreaterThan(offer('expensive', 'B').demand)
  })

  it('redistributes unmet demand to competitors with stock', () => {
    const settings = mockSettings({ cycles: 1, seed: 9 })
    settings.market.noiseSigma = 0
    const noStock = (_c: number, state: Parameters<typeof defaultDecisions>[1], s: typeof settings) => {
      const d = defaultDecisions(s, state)
      d.production.units = { A: 0, B: 0 }
      d.marketing.price = { A: 20, B: 30 }
      return d
    }
    const full = (_c: number, state: Parameters<typeof defaultDecisions>[1], s: typeof settings) => defaultDecisions(s, state)
    const withSubstitution = simulate(settings, { noStock, full })
    settings.market.substitutionRate = 0
    const withoutSubstitution = simulate(settings, { noStock, full })
    const sales = (run: typeof withSubstitution) => run.outputs[0].companies.find((c) => c.id === 'full')!.report!.operations.sales

    expect(sales(withSubstitution).A).toBeGreaterThan(sales(withoutSubstitution).A)
  })

  it('declares bankruptcy after repeated emergency loans and drops the company from the market', () => {
    const settings = mockSettings({ cycles: 6, seed: 11 })
    const reckless = (_c: number, state: Parameters<typeof defaultDecisions>[1], s: typeof settings) => {
      const d = defaultDecisions(s, state)
      d.marketing.advertising = { A: 60_000, B: 60_000 }
      return d
    }
    const prudent = (_c: number, state: Parameters<typeof defaultDecisions>[1], s: typeof settings) => defaultDecisions(s, state)
    const { outputs, states } = simulate(settings, { reckless, prudent })

    expect(states.reckless.status).toBe(CompanyStatus.BANKRUPT)
    const last = outputs[outputs.length - 1]
    expect(last.marketResult.offerings.every((o) => o.companyId === 'prudent')).toBe(true)
    expect(last.ranking[0].companyId).toBe('prudent')
  })
})
