import { createInitialCompanyState } from '../company.engine'
import { createInitialMarketState, runCycle } from '../cycle.engine'
import { defaultDecisions } from '../decisions.engine'
import { generateEconomy } from '../economy.engine'
import { createRng } from '../random.util'

import { DEFAULT_GAME_SETTINGS } from '../engine.constant'
import { CompanyDecisions, CompanyState, CycleOutput, GameSettings, ValuationMethod } from '../engine.types'

export const mockSettings = (overrides: Partial<GameSettings> = {}): GameSettings => ({ ...structuredClone(DEFAULT_GAME_SETTINGS), ...overrides })

export type Strategy = (cycle: number, state: CompanyState, settings: GameSettings) => CompanyDecisions

// Random but feasible decisions, used to stress the accounting identities
export function randomStrategy(seed: number): Strategy {
  const rng = createRng(seed)
  return (_cycle, state, settings) => {
    const d = defaultDecisions(settings, state)
    const capacity = state.capacity.active + state.capacity.pending
    const materials = { A: state.materials.A + state.materialsInTransit.A, B: state.materials.B + state.materialsInTransit.B }
    const share = rng.uniform(0.2, 0.8)
    d.production.units = {
      A: Math.min(materials.A, Math.floor(capacity * share * rng.uniform(0.3, 1))),
      B: Math.min(materials.B, Math.floor(capacity * (1 - share) * rng.uniform(0.3, 1))),
    }
    d.production.materialPurchases = { A: Math.floor(rng.uniform(0, 900)), B: Math.floor(rng.uniform(0, 900)) }
    d.production.capacityModules = rng.next() < 0.15 ? 1 : 0
    d.marketing.price = { A: Math.round(rng.uniform(18, 45)), B: Math.round(rng.uniform(25, 60)) }
    d.marketing.advertising = { A: Math.round(rng.uniform(0, 3000)), B: Math.round(rng.uniform(0, 3000)) }
    d.marketing.buyMarketResearch = rng.next() < 0.5
    d.research.quality = { A: Math.round(rng.uniform(0, 3000)), B: Math.round(rng.uniform(0, 3000)) }
    d.finance.shortTermLoan = rng.next() < 0.3 ? Math.round(rng.uniform(0, 20000)) : 0
    d.finance.longTermLoan = rng.next() < 0.2 ? Math.round(rng.uniform(0, 40000)) : 0
    d.finance.prepayment.amount = rng.next() < 0.2 ? Math.round(rng.uniform(0, 10000)) : 0
    d.finance.sharesToIssue = rng.next() < 0.1 ? Math.round(rng.uniform(0, 3000)) : 0
    d.finance.dividends = rng.next() < 0.3 ? Math.round(rng.uniform(0, 15000)) : 0
    d.finance.securitiesPurchase = rng.next() < 0.3 ? Math.round(rng.uniform(0, 50000)) : 0
    return d
  }
}

export interface SimulationRun {
  outputs: CycleOutput[]
  states: Record<string, CompanyState>
}

export function simulate(settings: GameSettings, strategies: Record<string, Strategy>, methods: Record<string, ValuationMethod> = {}): SimulationRun {
  const economy = generateEconomy(settings)
  const ids = Object.keys(strategies)
  let market = createInitialMarketState(ids.length)
  const states: Record<string, CompanyState> = Object.fromEntries(
    ids.map((id) => [id, createInitialCompanyState(settings, methods[id] ?? ValuationMethod.WEIGHTED_AVERAGE)]),
  )
  const outputs: CycleOutput[] = []
  for (let cycle = 1; cycle <= settings.cycles; cycle++) {
    const output = runCycle({
      settings,
      cycle,
      market,
      economy,
      companies: ids.map((id) => ({ id, state: states[id], decisions: strategies[id](cycle, states[id], settings) })),
    })
    for (const company of output.companies) states[company.id] = company.state
    market = output.market
    outputs.push(output)
  }
  return { outputs, states }
}
