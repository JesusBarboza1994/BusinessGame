import { PRODUCTS } from './engine.constant'
import { CompanyDecisions, CompanyState, GameSettings, PrepaymentMode } from './engine.types'

// Sensible starting point for a brand new company (mirrors the base Excel inputs)
export function defaultDecisions(settings: GameSettings, state?: CompanyState): CompanyDecisions {
  const materials = state ? { A: state.materials.A + state.materialsInTransit.A, B: state.materials.B + state.materialsInTransit.B } : settings.initial.materials
  const capacity = state ? state.capacity.active + state.capacity.pending : settings.initial.capacity
  const half = Math.floor(capacity / 2)
  const units = { A: Math.min(half, materials.A), B: Math.min(half, materials.B) }
  return {
    production: { units, materialPurchases: { ...units }, capacityModules: 0 },
    marketing: { price: { ...settings.market.refPrice }, advertising: { A: 500, B: 500 }, buyMarketResearch: false },
    research: { quality: { A: 800, B: 800 } },
    finance: {
      shortTermLoan: 0,
      longTermLoan: 0,
      prepayment: { amount: 0, mode: PrepaymentMode.REDUCE_INSTALLMENT },
      sharesToIssue: 0,
      dividends: 0,
      securitiesPurchase: 0,
    },
  }
}

// Used when a company does not submit: keep operations, drop one-off financial moves
export function repeatDecisions(previous: CompanyDecisions): CompanyDecisions {
  const copy = structuredClone(previous)
  copy.production.capacityModules = 0
  copy.finance = {
    shortTermLoan: 0,
    longTermLoan: 0,
    prepayment: { amount: 0, mode: previous.finance.prepayment.mode },
    sharesToIssue: 0,
    dividends: 0,
    securitiesPurchase: 0,
  }
  for (const p of PRODUCTS) copy.production.units[p] = Math.max(0, Math.floor(copy.production.units[p]))
  return copy
}
