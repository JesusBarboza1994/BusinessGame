import { variableUnitCost } from './company.engine'
import { defaultDecisions } from './decisions.engine'
import { layersUnits } from './inventory.engine'
import { createRng, hashSeed } from './random.util'
import { estimateDemand, validateDecisions, ValidationContext } from './validation.engine'

import { PRODUCTS } from './engine.constant'
import { BotLevel, BotProfile, BotStrategy, CompanyDecisions, CompanyState, GameSettings, PerProduct, Product } from './engine.types'

const SALT_BOT = 707

interface StrategyProfile {
  priceFactor: PerProduct<number>
  mixA: number
  advertising: PerProduct<number>
  quality: PerProduct<number>
  expandAt: number | null
  research: boolean
}

// Archetypes calibrated with scripts/calibrate.ts; each one is a credible way to run the company
export const BOT_STRATEGIES: Record<BotStrategy, StrategyProfile> = {
  [BotStrategy.BALANCED]: { priceFactor: { A: 1, B: 1 }, mixA: 0.5, advertising: { A: 600, B: 600 }, quality: { A: 800, B: 900 }, expandAt: 1.05, research: false },
  [BotStrategy.LOW_COST]: { priceFactor: { A: 0.92, B: 0.93 }, mixA: 0.62, advertising: { A: 400, B: 250 }, quality: { A: 300, B: 250 }, expandAt: 0.95, research: false },
  [BotStrategy.PREMIUM]: { priceFactor: { A: 1.05, B: 1.15 }, mixA: 0.35, advertising: { A: 300, B: 1500 }, quality: { A: 300, B: 2200 }, expandAt: null, research: true },
  [BotStrategy.GROWTH]: { priceFactor: { A: 0.95, B: 0.96 }, mixA: 0.5, advertising: { A: 1400, B: 1400 }, quality: { A: 900, B: 1000 }, expandAt: 0.95, research: true },
}

const LEVEL_NOISE: Record<BotLevel, number> = { [BotLevel.EASY]: 0.25, [BotLevel.NORMAL]: 0.08, [BotLevel.HARD]: 0 }

export interface BotContext extends ValidationContext {
  seed: number
  companyId: string
  averagePrice: PerProduct<number> | null
}

const hashString = (value: string): number => {
  let h = 0
  for (let i = 0; i < value.length; i++) h = (Math.imul(h, 31) + value.charCodeAt(i)) >>> 0
  return h
}

const perProduct = <T>(fn: (p: Product) => T): PerProduct<T> => ({ A: fn('A'), B: fn('B') })

// Decides like a reasonable manager of the given archetype; easier levels are noisier and less adaptive
export function decideForBot(settings: GameSettings, state: CompanyState, profile: BotProfile, ctx: BotContext): CompanyDecisions {
  const strategy = BOT_STRATEGIES[profile.strategy]
  const level = profile.level
  const rng = createRng(hashSeed(ctx.seed, ctx.cycle, hashString(ctx.companyId), SALT_BOT))
  const noise = LEVEL_NOISE[level]
  const jitter = (value: number): number => (noise ? value * rng.uniform(1 - noise, 1 + noise) : value)
  const adaptive = level !== BotLevel.EASY
  const d = defaultDecisions(settings, state)

  const capacity = state.capacity.active + state.capacity.pending
  const materials = perProduct((p) => state.materials[p] + state.materialsInTransit[p])
  const stock = perProduct((p) => layersUnits(state.finishedGoods[p]))
  const hasHistory = state.lastDemand.A + state.lastDemand.B > 0

  const forecast = (() => {
    if (adaptive && hasHistory) return perProduct((p) => state.lastDemand[p] * (1 + settings.market.growth))
    const base = estimateDemand(settings, state, ctx)
    const total = base.A + base.B
    return { A: total * strategy.mixA, B: total * (1 - strategy.mixA) }
  })()

  const units = perProduct((p) => Math.max(0, Math.min(materials[p], Math.round(jitter(forecast[p] * 1.05 - stock[p])))))
  const usage = PRODUCTS.reduce((acc, p) => acc + units[p] * settings.production.capacityUsage[p], 0)
  if (usage > capacity) for (const p of PRODUCTS) units[p] = Math.floor((units[p] * capacity) / usage)
  d.production.units = units

  const expand =
    adaptive && strategy.expandAt !== null && state.capacity.pending === 0 && hasHistory && state.lastDemand.A + state.lastDemand.B > capacity * strategy.expandAt
  d.production.capacityModules = expand ? 1 : 0
  const nextCapacity = capacity + (expand ? settings.production.moduleUnits : 0)
  const producedTotal = units.A + units.B
  const shareA = producedTotal > 0 ? units.A / producedTotal : strategy.mixA
  d.production.materialPurchases = perProduct((p) => {
    const need = nextCapacity * (p === 'A' ? shareA : 1 - shareA) * 1.1
    return Math.max(0, Math.round(jitter(need)) - (materials[p] - units[p]))
  })

  const reference = adaptive && ctx.averagePrice ? ctx.averagePrice : settings.market.refPrice
  d.marketing.price = perProduct((p) => {
    let price = reference[p] * strategy.priceFactor[p]
    if (level === BotLevel.HARD && hasHistory) {
      if (state.lastSales[p] < state.lastDemand[p] * 0.9) price *= 1.04
      else if (stock[p] > state.lastSales[p] * 0.25) price *= 0.96
    }
    const floor = variableUnitCost(settings, p) * 1.1
    return Math.round(Math.max(floor, jitter(price)) * 2) / 2
  })
  d.marketing.advertising = perProduct((p) => Math.round(jitter(strategy.advertising[p]) / 50) * 50)
  d.marketing.buyMarketResearch = adaptive && strategy.research
  d.research.quality = perProduct((p) => Math.round(jitter(strategy.quality[p]) / 50) * 50)

  if (adaptive) manageCash(settings, state, d, ctx, level)
  return d
}

// Finances expansions with long-term debt, covers projected gaps with short-term debt and parks idle cash
function manageCash(settings: GameSettings, state: CompanyState, d: CompanyDecisions, ctx: BotContext, level: BotLevel): void {
  const reserve = settings.initial.cash * 0.1
  let check = validateDecisions(settings, state, d, ctx)
  const moduleCost = d.production.capacityModules * settings.production.moduleUnits * settings.production.moduleCostPerUnit
  if (moduleCost > 0 && check.projection.estimatedCashEnd < settings.initial.cash * 0.3) {
    d.finance.longTermLoan = Math.floor(Math.min(check.projection.creditRoom, moduleCost))
    check = validateDecisions(settings, state, d, ctx)
  }
  if (check.projection.estimatedCashEnd < reserve) {
    const room = Math.max(0, check.projection.creditRoom - d.finance.longTermLoan)
    d.finance.shortTermLoan = Math.floor(Math.min(room, reserve - check.projection.estimatedCashEnd))
    check = validateDecisions(settings, state, d, ctx)
  }
  if (level === BotLevel.HARD && d.finance.shortTermLoan === 0) {
    const idle = check.projection.estimatedCashEnd - settings.initial.cash * 0.25
    d.finance.securitiesPurchase = Math.max(0, Math.floor(idle / 1000) * 1000)
  }
}
