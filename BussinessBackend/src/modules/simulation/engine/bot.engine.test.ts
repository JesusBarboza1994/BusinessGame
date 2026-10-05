import { decideForBot } from './bot.engine'
import { createInitialCompanyState } from './company.engine'
import { validateDecisions } from './validation.engine'

import { mockSettings, simulate, Strategy } from './mocks/engine.mock'

import { BotLevel, BotStrategy, CompanyStatus, MarketState, ValuationMethod } from './engine.types'
import { generateEconomy } from './economy.engine'

const botStrategy = (id: string, strategy: BotStrategy, level: BotLevel, companies: number): Strategy => {
  const settings = mockSettings()
  const economy = generateEconomy(settings)
  return (cycle, state, s) => {
    const market: MarketState = { cycle: cycle - 1, growthIndex: 1, latentDemand: 0, initialCompanies: companies }
    const decisions = decideForBot(s, state, { strategy, level }, { cycle, market, economy, companies, seed: s.seed, companyId: id, averagePrice: null })
    const check = validateDecisions(s, state, decisions, { cycle, market, economy, companies })
    if (!check.valid) throw new Error(`${id} cycle ${cycle}: ${check.errors.map((e) => e.code).join(',')}`)
    return decisions
  }
}

describe('decideForBot', () => {
  const strategies = Object.values(BotStrategy)
  const levels = Object.values(BotLevel)

  it('always produces feasible decisions for every strategy and level', () => {
    const settings = mockSettings({ cycles: 10, seed: 21 })
    const companies = strategies.length * levels.length
    const bots = Object.fromEntries(
      strategies.flatMap((strategy) => levels.map((level) => [`${strategy}-${level}`, botStrategy(`${strategy}-${level}`, strategy, level, companies)])),
    )

    expect(() => simulate(settings, bots)).not.toThrow()
  })

  it('keeps normal and hard bots solvent', () => {
    for (const seed of [1, 2, 3]) {
      const settings = mockSettings({ cycles: 10, seed })
      const bots = Object.fromEntries(
        strategies.flatMap((strategy) => [BotLevel.NORMAL, BotLevel.HARD].map((level) => [`${strategy}-${level}`, botStrategy(`${strategy}-${level}`, strategy, level, 8)])),
      )
      const { states } = simulate(settings, bots)

      for (const [id, state] of Object.entries(states)) expect(state.status, `${id} seed ${seed}`).toBe(CompanyStatus.ACTIVE)
    }
  })

  it('is deterministic for the same game, cycle and company, and varies between companies', () => {
    const settings = mockSettings()
    const state = createInitialCompanyState(settings, ValuationMethod.WEIGHTED_AVERAGE)
    const ctx = { cycle: 1, market: { cycle: 0, growthIndex: 1, latentDemand: 0, initialCompanies: 3 }, economy: generateEconomy(settings), companies: 3, seed: 9, averagePrice: null }
    const profile = { strategy: BotStrategy.BALANCED, level: BotLevel.EASY }

    expect(decideForBot(settings, state, profile, { ...ctx, companyId: 'a' })).toEqual(decideForBot(settings, state, profile, { ...ctx, companyId: 'a' }))
    expect(decideForBot(settings, state, profile, { ...ctx, companyId: 'a' })).not.toEqual(decideForBot(settings, state, profile, { ...ctx, companyId: 'b' }))
  })
})
