import { creditRoom, longTermBalance, openCycle, shareIssuePrice, startWorking, variableUnitCost } from './company.engine'
import { layersUnits } from './inventory.engine'
import { baseMarketSize, economyAt, segmentWeights } from './market.engine'
import { roundDeep, sum } from './math.util'

import { PRODUCTS } from './engine.constant'
import { CompanyDecisions, CompanyState, EconomySeries, GameSettings, MarketState, PerProduct, Product } from './engine.types'

export type IssueSeverity = 'error' | 'warning'

export interface DecisionIssue {
  code: string
  field: string
  severity: IssueSeverity
  message: string
  params?: Record<string, number | string>
}

export interface DecisionProjection {
  capacity: number
  materialsAvailable: PerProduct<number>
  finishedGoodsAvailable: PerProduct<number>
  maxProduction: PerProduct<number>
  maxDividends: number
  creditRoom: number
  shareIssuePrice: number
  shareIssueAllowed: boolean
  cashAfterDebtService: number
  estimatedDemand: PerProduct<number>
  estimatedSales: PerProduct<number>
  estimatedRevenue: number
  estimatedSpending: number
  estimatedCashEnd: number
  variableUnitCost: PerProduct<number>
  estimatedUnitCost: PerProduct<number>
  capacityUtilization: number
}

export interface DecisionValidation {
  valid: boolean
  errors: DecisionIssue[]
  warnings: DecisionIssue[]
  projection: DecisionProjection
}

export interface ValidationContext {
  cycle: number
  market: MarketState
  economy: EconomySeries
  companies: number
}

const LOW_UTILIZATION = 0.5
const fmt = (value: number): string => Math.round(value).toLocaleString('es-PE')

// Dry-runs the opening of the cycle to tell the player, before closing, what is feasible and what is risky
export function validateDecisions(
  settings: GameSettings,
  state: CompanyState,
  decisions: CompanyDecisions,
  ctx: ValidationContext,
): DecisionValidation {
  const errors: DecisionIssue[] = []
  const warnings: DecisionIssue[] = []
  const w = startWorking('dry-run', state, decisions)
  openCycle(settings, w)
  const s = w.state
  const d = decisions
  const prod = settings.production

  const capacity = s.capacity.active
  const usage = sum(PRODUCTS.map((p) => d.production.units[p] * prod.capacityUsage[p]))
  if (usage > capacity) {
    errors.push({
      code: 'PRODUCTION_EXCEEDS_CAPACITY',
      field: 'production.units',
      severity: 'error',
      message: `Quieres producir ${fmt(usage)} unidades pero tu planta solo tiene capacidad para ${fmt(capacity)} este ciclo.`,
      params: { requested: usage, capacity },
    })
  }
  for (const p of PRODUCTS) {
    if (d.production.units[p] > s.materials[p]) {
      errors.push({
        code: 'PRODUCTION_EXCEEDS_MATERIALS',
        field: `production.units.${p}`,
        severity: 'error',
        message: `Para producir ${fmt(d.production.units[p])} unidades de ${p} necesitas ${fmt(d.production.units[p])} de materia prima y solo tendrás ${fmt(s.materials[p])}.`,
        params: { product: p, requested: d.production.units[p], available: s.materials[p] },
      })
    }
  }

  const balance = longTermBalance(s)
  if (d.finance.prepayment.amount > balance + 1e-6) {
    errors.push({
      code: 'PREPAYMENT_EXCEEDS_BALANCE',
      field: 'finance.prepayment.amount',
      severity: 'error',
      message: `Solo debes ${fmt(balance)} en préstamos de largo plazo; no puedes prepagar ${fmt(d.finance.prepayment.amount)}.`,
      params: { balance },
    })
  }
  const room = creditRoom(settings, s, w.equityAtStart) + Math.min(d.finance.prepayment.amount, balance)
  const requestedCredit = d.finance.shortTermLoan + d.finance.longTermLoan
  if (requestedCredit > room + 1e-6) {
    errors.push({
      code: 'CREDIT_LIMIT_EXCEEDED',
      field: 'finance.longTermLoan',
      severity: 'error',
      message: `El banco te presta como máximo ${fmt(room)} más (deuda ≤ ${settings.finance.creditLimitMultiple}× tu patrimonio).`,
      params: { room, requested: requestedCredit },
    })
  }
  const maxDividends = Math.max(0, w.retainedAtStart)
  if (d.finance.dividends > maxDividends + 1e-6) {
    errors.push({
      code: 'DIVIDENDS_EXCEED_RETAINED',
      field: 'finance.dividends',
      severity: 'error',
      message: `Solo puedes repartir dividendos hasta tus utilidades retenidas: ${fmt(maxDividends)}.`,
      params: { maxDividends },
    })
  }
  const issue = shareIssuePrice(settings, s)
  if (d.finance.sharesToIssue > 0 && !issue.allowed) {
    errors.push({
      code: 'SHARE_ISSUE_BELOW_PAR',
      field: 'finance.sharesToIssue',
      severity: 'error',
      message: `Tu acción vale muy poco ahora: emitirías por debajo del valor nominal (${settings.initial.shareParValue}).`,
      params: { issuePrice: issue.price },
    })
  }

  const finishedGoodsAvailable = PRODUCTS.reduce(
    (acc, p) => ({ ...acc, [p]: layersUnits(s.finishedGoods[p]) + Math.min(d.production.units[p], s.materials[p]) }),
    {} as PerProduct<number>,
  )
  const estimatedDemand = estimateDemand(settings, state, ctx)
  const estimatedSales = PRODUCTS.reduce(
    (acc, p) => ({ ...acc, [p]: Math.min(estimatedDemand[p], finishedGoodsAvailable[p]) }),
    {} as PerProduct<number>,
  )
  const estimatedRevenue = sum(PRODUCTS.map((p) => estimatedSales[p] * d.marketing.price[p]))
  const issueCash = issue.allowed ? d.finance.sharesToIssue * issue.price * (1 - settings.finance.issueCost) : 0
  const productionCash = sum(PRODUCTS.map((p) => d.production.units[p] * (prod.laborCost[p] + prod.variableOverhead[p])))
  const purchases = sum(PRODUCTS.map((p) => d.production.materialPurchases[p] * prod.materialCost[p]))
  const modules = d.production.capacityModules * prod.moduleUnits * prod.moduleCostPerUnit
  const admin = settings.costs.adminFixed * Math.sqrt(capacity / settings.initial.capacity) + settings.costs.adminVariableRate * estimatedRevenue
  const estimatedSpending =
    productionCash +
    purchases +
    modules +
    admin +
    d.marketing.advertising.A +
    d.marketing.advertising.B +
    d.research.quality.A +
    d.research.quality.B +
    (d.marketing.buyMarketResearch ? settings.costs.marketResearchCost : 0) +
    d.finance.securitiesPurchase +
    d.finance.dividends +
    d.finance.prepayment.amount
  const cashAfterDebtService = s.cash
  const estimatedCashEnd = cashAfterDebtService + requestedCredit + issueCash + estimatedRevenue - estimatedSpending

  if (estimatedCashEnd < 0) {
    warnings.push({
      code: 'PROJECTED_CASH_NEGATIVE',
      field: 'finance',
      severity: 'warning',
      message: `Según nuestra estimación terminarías con caja negativa (${fmt(estimatedCashEnd)}). El banco te dará un préstamo de emergencia al ${Math.round(settings.finance.emergencyRate * 100)}%.`,
      params: { estimatedCashEnd },
    })
  }
  const utilization = capacity > 0 ? Math.min(usage, capacity) / capacity : 0
  if (utilization < LOW_UTILIZATION) {
    warnings.push({
      code: 'LOW_CAPACITY_UTILIZATION',
      field: 'production.units',
      severity: 'warning',
      message: `Usarás solo el ${Math.round(utilization * 100)}% de tu planta. La capacidad ociosa se paga igual.`,
      params: { utilization },
    })
  }
  for (const p of PRODUCTS) {
    const unitCost = variableUnitCost(settings, p)
    if (d.marketing.price[p] < unitCost) {
      warnings.push({
        code: 'PRICE_BELOW_VARIABLE_COST',
        field: `marketing.price.${p}`,
        severity: 'warning',
        message: `El precio de ${p} (${d.marketing.price[p]}) no cubre ni su costo variable (${unitCost}). Pierdes dinero por cada unidad.`,
        params: { product: p, unitCost },
      })
    }
    const nextMaterials = s.materials[p] - Math.min(d.production.units[p], s.materials[p]) + d.production.materialPurchases[p]
    if (d.production.units[p] > 0 && nextMaterials < d.production.units[p]) {
      warnings.push({
        code: 'MATERIALS_SHORT_NEXT_CYCLE',
        field: `production.materialPurchases.${p}`,
        severity: 'warning',
        message: `El próximo ciclo tendrás ${fmt(nextMaterials)} de materia prima ${p}; no alcanza para repetir esta producción.`,
        params: { product: p, nextMaterials },
      })
    }
  }
  if (d.finance.securitiesPurchase > 0 && d.finance.securitiesPurchase > Math.max(0, estimatedCashEnd + d.finance.securitiesPurchase)) {
    warnings.push({
      code: 'SECURITIES_EXCEED_CASH',
      field: 'finance.securitiesPurchase',
      severity: 'warning',
      message: 'Podrías no tener caja suficiente para comprar todos esos valores; se comprará solo lo que alcance.',
    })
  }

  const fixedPerUnit = capacity > 0 ? (s.fixedAssets.gross * prod.depreciationRate) / capacity : 0
  const projection: DecisionProjection = {
    capacity,
    materialsAvailable: { ...s.materials },
    finishedGoodsAvailable,
    maxProduction: perProductOf((p) => Math.min(s.materials[p], Math.floor(capacity / prod.capacityUsage[p]))),
    maxDividends,
    creditRoom: room,
    shareIssuePrice: issue.price,
    shareIssueAllowed: issue.allowed,
    cashAfterDebtService,
    estimatedDemand,
    estimatedSales,
    estimatedRevenue,
    estimatedSpending,
    estimatedCashEnd,
    variableUnitCost: perProductOf((p) => variableUnitCost(settings, p)),
    estimatedUnitCost: perProductOf((p) => variableUnitCost(settings, p) + prod.capacityUsage[p] * fixedPerUnit),
    capacityUtilization: utilization,
  }
  return { valid: errors.length === 0, errors, warnings, projection: roundDeep(projection) }
}

const perProductOf = (fn: (p: Product) => number): PerProduct<number> => ({ A: fn('A'), B: fn('B') })

// Rough per-company demand guess: last demand plus trend, or an even split of the market on the first cycle
export function estimateDemand(settings: GameSettings, state: CompanyState, ctx: ValidationContext): PerProduct<number> {
  const growth = 1 + settings.market.growth
  if (state.lastDemand.A + state.lastDemand.B > 0) {
    return perProductOf((p) => Math.round(state.lastDemand[p] * growth))
  }
  const economyIndex = economyAt(ctx.economy, ctx.cycle)
  const base = baseMarketSize(settings, ctx.market, ctx.market.growthIndex * growth, economyIndex, 1) / Math.max(1, ctx.companies)
  const weights = segmentWeights(settings, economyIndex)
  return { A: Math.round(base * weights.PRICE), B: Math.round(base * weights.QUALITY) }
}
