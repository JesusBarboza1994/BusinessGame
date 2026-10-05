import { addLayer, consumeLayers, layersUnits, layersValue } from './inventory.engine'
import { createLongTermLoan, payInstallment, prepayLoan, principalDueWithin, quarterlyRateFromAnnual } from './loan.engine'
import { computeMarketingIndex, computeQualityIndex } from './market.engine'
import { clamp, safeDiv, sum } from './math.util'
import { Rng } from './random.util'

import { BALANCE_TOLERANCE, PRODUCTS } from './engine.constant'
import {
  BalanceSheet,
  CashCategory,
  CashMove,
  CompanyDecisions,
  CompanyState,
  CompanyStatus,
  CycleReport,
  DecisionAdjustment,
  DirectCostingStatement,
  GameSettings,
  IncomeStatement,
  Indicators,
  OfferingResult,
  PerProduct,
  Product,
  ValuationMethod,
} from './engine.types'

const CURRENT_PORTION_QUARTERS = 4
const QUARTER_DAYS = 90

const perProduct = <T>(fn: (product: Product) => T): PerProduct<T> => ({ A: fn('A'), B: fn('B') })

export function createInitialCompanyState(settings: GameSettings, valuationMethod: ValuationMethod): CompanyState {
  const { initial, production } = settings
  const fixedGross = initial.capacity * production.moduleCostPerUnit
  const materialsValue = sum(PRODUCTS.map((p) => initial.materials[p] * production.materialCost[p]))
  const equity = initial.cash + fixedGross + materialsValue
  const sharePrice = equity / initial.shares
  return {
    cycle: 0,
    status: CompanyStatus.ACTIVE,
    bankruptCycle: null,
    valuationMethod,
    cash: initial.cash,
    securities: { principal: 0, accruedYield: 0 },
    finishedGoods: { A: [], B: [] },
    materials: { ...initial.materials },
    materialsInTransit: { A: 0, B: 0 },
    capacity: { active: initial.capacity, pending: 0 },
    fixedAssets: { gross: fixedGross, accumulatedDepreciation: 0, inProgress: 0 },
    debt: { shortTerm: { principal: 0, interest: 0 }, emergency: { principal: 0 }, longTerm: [], longTermInterestPayable: 0 },
    // Initial share capital is the whole contributed equity; any difference vs par goes to additional capital
    equity: {
      shareCapital: initial.shares * initial.shareParValue,
      additionalCapital: equity - initial.shares * initial.shareParValue,
      legalReserve: 0,
      retainedEarnings: 0,
    },
    shares: initial.shares,
    taxLosses: [],
    qualityStock: { A: 0, B: 0 },
    marketingStock: { A: 0, B: 0 },
    emergencyStreak: 0,
    netIncomeHistory: [],
    equityHistory: [equity],
    contributedCapital: equity,
    cumulativeDividends: 0,
    cumulativeDividendsPerShare: 0,
    initialSharePrice: sharePrice,
    sharePrice,
    lastSales: { A: 0, B: 0 },
    lastDemand: { A: 0, B: 0 },
  }
}

export const totalEquity = (state: CompanyState): number =>
  state.equity.shareCapital + state.equity.additionalCapital + state.equity.legalReserve + state.equity.retainedEarnings

export const longTermBalance = (state: CompanyState): number => sum(state.debt.longTerm.map((loan) => loan.balance))

export const variableUnitCost = (settings: GameSettings, product: Product): number =>
  settings.production.materialCost[product] + settings.production.laborCost[product] + settings.production.variableOverhead[product]

export function creditRoom(settings: GameSettings, state: CompanyState, equityAtStart: number): number {
  return Math.max(0, settings.finance.creditLimitMultiple * Math.max(0, equityAtStart) - longTermBalance(state) - state.debt.shortTerm.principal)
}

export function shareIssuePrice(settings: GameSettings, state: CompanyState): { price: number; netPerShare: number; allowed: boolean } {
  const price = state.sharePrice * (1 - settings.finance.issueDiscount)
  const netPerShare = price * (1 - settings.finance.issueCost)
  return { price, netPerShare, allowed: netPerShare >= settings.initial.shareParValue }
}

export interface WorkingCompany {
  id: string
  state: CompanyState
  decisions: CompanyDecisions
  ledger: CashMove[]
  adjustments: DecisionAdjustment[]
  openingCash: number
  equityAtStart: number
  retainedAtStart: number
  finishedAtStart: PerProduct<{ units: number; value: number }>
  materialsAtStart: PerProduct<number>
  produced: PerProduct<number>
  unitCost: PerProduct<number>
  depreciation: number
  idleCapacity: number
  emergencyInterest: number
  prepaymentPenalty: number
  qualityIndex: PerProduct<number>
  marketingIndex: PerProduct<number>
}

function move(w: WorkingCompany, category: CashCategory, concept: string, amount: number): void {
  if (Math.abs(amount) < 1e-9) return
  w.state.cash += amount
  w.ledger.push({ category, concept, amount })
}

function adjust(w: WorkingCompany, code: string, field: string, requested: number, applied: number): number {
  if (Math.abs(requested - applied) > 1e-6) w.adjustments.push({ code, field, requested, applied })
  return applied
}

export function startWorking(id: string, state: CompanyState, decisions: CompanyDecisions): WorkingCompany {
  const clone = structuredClone(state)
  return {
    id,
    state: clone,
    decisions: structuredClone(decisions),
    ledger: [],
    adjustments: [],
    openingCash: clone.cash,
    equityAtStart: totalEquity(clone),
    retainedAtStart: clone.equity.retainedEarnings,
    finishedAtStart: perProduct((p) => ({ units: layersUnits(clone.finishedGoods[p]), value: layersValue(clone.finishedGoods[p]) })),
    materialsAtStart: { A: 0, B: 0 },
    produced: { A: 0, B: 0 },
    unitCost: { A: 0, B: 0 },
    depreciation: 0,
    idleCapacity: 0,
    emergencyInterest: 0,
    prepaymentPenalty: 0,
    qualityIndex: { A: 0, B: 0 },
    marketingIndex: { A: 0, B: 0 },
  }
}

// Step 1: deliveries, capacity activation, debt service and maturing securities
export function openCycle(settings: GameSettings, w: WorkingCompany): void {
  const s = w.state
  for (const p of PRODUCTS) {
    s.materials[p] += s.materialsInTransit[p]
    s.materialsInTransit[p] = 0
  }
  w.materialsAtStart = { ...s.materials }
  s.capacity.active += s.capacity.pending
  s.capacity.pending = 0
  s.fixedAssets.gross += s.fixedAssets.inProgress
  s.fixedAssets.inProgress = 0

  if (s.debt.shortTerm.principal > 0) {
    move(w, 'FINANCING', 'shortTermLoanRepayment', -s.debt.shortTerm.principal)
    move(w, 'OPERATING', 'shortTermInterestPaid', -s.debt.shortTerm.interest)
    s.debt.shortTerm = { principal: 0, interest: 0 }
  }
  if (s.debt.emergency.principal > 0) {
    w.emergencyInterest = s.debt.emergency.principal * settings.finance.emergencyRate
    move(w, 'FINANCING', 'emergencyLoanRepayment', -s.debt.emergency.principal)
    move(w, 'OPERATING', 'emergencyInterestPaid', -w.emergencyInterest)
    s.debt.emergency = { principal: 0 }
  }
  s.debt.longTerm = s.debt.longTerm
    .map((loan) => {
      const paid = payInstallment(loan)
      move(w, 'OPERATING', 'longTermInterestPaid', -paid.interestPaid)
      move(w, 'FINANCING', 'longTermLoanRepayment', -paid.principalPaid)
      return paid.loan
    })
    .filter((loan) => loan.balance > 1e-6)
  s.debt.longTermInterestPayable = 0

  if (s.securities.principal > 0) {
    move(w, 'INVESTING', 'securitiesRedemption', s.securities.principal)
    move(w, 'OPERATING', 'securitiesYieldCollected', s.securities.accruedYield)
    s.securities = { principal: 0, accruedYield: 0 }
  }
}

// Step 2: new loans, prepayments and share issues, clipped to what the bank and market allow
export function applyFinancing(settings: GameSettings, w: WorkingCompany, cycle: number): void {
  const s = w.state
  const f = w.decisions.finance
  const fin = settings.finance

  const balance = longTermBalance(s)
  const prepay = adjust(w, 'PREPAYMENT_CLIPPED', 'finance.prepayment.amount', f.prepayment.amount, Math.min(f.prepayment.amount, balance))
  f.prepayment.amount = prepay
  if (prepay > 0) {
    let pending = prepay
    s.debt.longTerm = s.debt.longTerm
      .map((loan) => {
        const part = Math.min(pending, loan.balance)
        pending -= part
        return part > 0 ? prepayLoan(loan, part, f.prepayment.mode) : loan
      })
      .filter((loan) => loan.balance > 1e-6)
    w.prepaymentPenalty = prepay * fin.prepaymentPenalty
    move(w, 'FINANCING', 'longTermPrepayment', -prepay)
    move(w, 'OPERATING', 'prepaymentPenaltyPaid', -w.prepaymentPenalty)
  }

  const room = creditRoom(settings, s, w.equityAtStart)
  const requested = f.shortTermLoan + f.longTermLoan
  const factor = requested > room ? room / requested : 1
  f.shortTermLoan = adjust(w, 'CREDIT_LIMIT', 'finance.shortTermLoan', f.shortTermLoan, Math.floor(f.shortTermLoan * factor))
  f.longTermLoan = adjust(w, 'CREDIT_LIMIT', 'finance.longTermLoan', f.longTermLoan, Math.floor(f.longTermLoan * factor))
  if (f.shortTermLoan > 0) {
    s.debt.shortTerm.principal = f.shortTermLoan
    move(w, 'FINANCING', 'shortTermLoan', f.shortTermLoan)
  }
  if (f.longTermLoan > 0) {
    const rate = quarterlyRateFromAnnual(fin.longTermAnnualRate)
    s.debt.longTerm.push(createLongTermLoan(`L${cycle}`, cycle, f.longTermLoan, rate, fin.longTermQuarters))
    move(w, 'FINANCING', 'longTermLoan', f.longTermLoan)
  }

  const issue = shareIssuePrice(settings, s)
  const shares = adjust(w, 'SHARE_ISSUE_BELOW_PAR', 'finance.sharesToIssue', f.sharesToIssue, issue.allowed ? Math.floor(f.sharesToIssue) : 0)
  f.sharesToIssue = shares
  if (shares > 0) {
    const gross = shares * issue.price
    const cost = gross * fin.issueCost
    move(w, 'FINANCING', 'shareIssue', gross)
    move(w, 'FINANCING', 'shareIssueCost', -cost)
    s.equity.shareCapital += shares * settings.initial.shareParValue
    s.equity.additionalCapital += gross - cost - shares * settings.initial.shareParValue
    s.shares += shares
    s.contributedCapital += gross - cost
  }
}

// Step 3: production limited by capacity and materials, absorption costing with idle capacity
export function produce(settings: GameSettings, w: WorkingCompany): void {
  const s = w.state
  const prod = settings.production
  const units = perProduct((p) => {
    const requested = w.decisions.production.units[p]
    return adjust(w, 'MATERIALS_SHORTAGE', `production.units.${p}`, requested, Math.max(0, Math.min(Math.floor(requested), s.materials[p])))
  })
  const usage = sum(PRODUCTS.map((p) => units[p] * prod.capacityUsage[p]))
  if (usage > s.capacity.active) {
    const factor = s.capacity.active / usage
    for (const p of PRODUCTS) units[p] = adjust(w, 'CAPACITY_EXCEEDED', `production.units.${p}`, units[p], Math.floor(units[p] * factor))
  }

  const depreciation = Math.min(s.fixedAssets.gross * prod.depreciationRate, s.fixedAssets.gross - s.fixedAssets.accumulatedDepreciation)
  s.fixedAssets.accumulatedDepreciation += depreciation
  const fixedPerUnit = s.capacity.active > 0 ? depreciation / s.capacity.active : 0
  let absorbed = 0
  for (const p of PRODUCTS) {
    const fixedShare = prod.capacityUsage[p] * fixedPerUnit
    w.unitCost[p] = variableUnitCost(settings, p) + fixedShare
    w.produced[p] = units[p]
    absorbed += units[p] * fixedShare
    s.materials[p] -= units[p]
    move(w, 'OPERATING', `laborCost${p}`, -units[p] * prod.laborCost[p])
    move(w, 'OPERATING', `manufacturingOverhead${p}`, -units[p] * prod.variableOverhead[p])
    s.finishedGoods[p] = addLayer(s.finishedGoods[p], units[p], w.unitCost[p], s.valuationMethod)
  }
  w.decisions.production.units = units
  w.depreciation = depreciation
  w.idleCapacity = depreciation - absorbed
}

// Quality and marketing accumulate this cycle's spend before the market is resolved
export function updateIntangibles(settings: GameSettings, w: WorkingCompany): void {
  const s = w.state
  const m = settings.market
  for (const p of PRODUCTS) {
    s.qualityStock[p] = s.qualityStock[p] * (1 - m.qualityDecay) + w.decisions.research.quality[p]
    s.marketingStock[p] = s.marketingStock[p] * (1 - m.marketingDecay) + w.decisions.marketing.advertising[p]
    w.qualityIndex[p] = computeQualityIndex(settings, p, s.qualityStock[p])
    w.marketingIndex[p] = computeMarketingIndex(settings, s.marketingStock[p])
  }
}

export interface CloseContext {
  cycle: number
  offerings: PerProduct<OfferingResult | null>
  rng: Rng
}

// Steps 5-9: sales, expenses, investments, interest, tax, emergency loan, statements and valuation
export function closeCompany(settings: GameSettings, w: WorkingCompany, ctx: CloseContext): CycleReport {
  const s = w.state
  const d = w.decisions
  const fin = settings.finance
  const prod = settings.production

  const sold = perProduct((p) => ctx.offerings[p]?.sales ?? 0)
  const revenue = perProduct((p) => sold[p] * d.marketing.price[p])
  const costOfSales = perProduct((p) => {
    const consumed = consumeLayers(s.finishedGoods[p], sold[p])
    s.finishedGoods[p] = consumed.layers
    return consumed.cost
  })
  for (const p of PRODUCTS) move(w, 'OPERATING', `sales${p}`, revenue[p])
  const revenueTotal = revenue.A + revenue.B

  for (const p of PRODUCTS) {
    const offering = ctx.offerings[p]
    const lostFraction = offering && offering.demand > 0 ? offering.lostSales / offering.demand : 0
    s.marketingStock[p] *= 1 - settings.market.stockoutReputationLoss * lostFraction
  }

  const marketing = d.marketing.advertising.A + d.marketing.advertising.B
  const qualityImprovement = d.research.quality.A + d.research.quality.B
  const marketResearch = d.marketing.buyMarketResearch ? settings.costs.marketResearchCost : 0
  const adminFixed = settings.costs.adminFixed * Math.sqrt(s.capacity.active / settings.initial.capacity)
  const adminVariable = settings.costs.adminVariableRate * revenueTotal * ctx.rng.uniform(1 - settings.costs.adminNoise, 1 + settings.costs.adminNoise)
  const administrative = adminFixed + adminVariable
  const finishedUnitsEnd = layersUnits(s.finishedGoods.A) + layersUnits(s.finishedGoods.B)
  const materialsUnitsEnd = s.materials.A + s.materials.B
  const holding = finishedUnitsEnd * settings.costs.holdingCost.finished + materialsUnitsEnd * settings.costs.holdingCost.materials
  move(w, 'OPERATING', 'marketing', -marketing)
  move(w, 'OPERATING', 'qualityImprovement', -qualityImprovement)
  move(w, 'OPERATING', 'marketResearch', -marketResearch)
  move(w, 'OPERATING', 'administrative', -administrative)
  move(w, 'OPERATING', 'holding', -holding)

  for (const p of PRODUCTS) {
    const units = Math.max(0, Math.floor(d.production.materialPurchases[p]))
    d.production.materialPurchases[p] = units
    move(w, 'OPERATING', `materialPurchases${p}`, -units * prod.materialCost[p])
    s.materialsInTransit[p] += units
  }

  const modules = Math.max(0, Math.floor(d.production.capacityModules))
  d.production.capacityModules = modules
  const moduleCost = modules * prod.moduleUnits * prod.moduleCostPerUnit
  move(w, 'INVESTING', 'capacityExpansion', -moduleCost)
  s.fixedAssets.inProgress += moduleCost
  s.capacity.pending += modules * prod.moduleUnits

  const maxDividends = Math.max(0, w.retainedAtStart)
  const dividends = adjust(w, 'DIVIDENDS_CLIPPED', 'finance.dividends', d.finance.dividends, Math.min(d.finance.dividends, maxDividends))
  d.finance.dividends = dividends
  if (dividends > 0) {
    move(w, 'FINANCING', 'dividends', -dividends)
    s.equity.retainedEarnings -= dividends
    s.cumulativeDividends += dividends
    s.cumulativeDividendsPerShare += dividends / s.shares
  }

  const securities = adjust(w, 'SECURITIES_CLIPPED', 'finance.securitiesPurchase', d.finance.securitiesPurchase, Math.max(0, Math.min(d.finance.securitiesPurchase, s.cash)))
  d.finance.securitiesPurchase = securities
  const financialIncome = securities * fin.securitiesRate
  if (securities > 0) {
    move(w, 'INVESTING', 'securitiesPurchase', -securities)
    s.securities = { principal: securities, accruedYield: financialIncome }
  }

  const shortTermInterest = s.debt.shortTerm.principal * fin.shortTermRate
  s.debt.shortTerm.interest = shortTermInterest
  const longTermInterest = sum(s.debt.longTerm.map((loan) => loan.balance * loan.rate))
  s.debt.longTermInterestPayable = longTermInterest

  const costOfSalesTotal = costOfSales.A + costOfSales.B
  const grossProfit = revenueTotal - costOfSalesTotal
  const opexTotal = marketing + qualityImprovement + marketResearch + administrative + holding + w.idleCapacity
  const ebit = grossProfit - opexTotal
  const financialExpensesTotal = shortTermInterest + w.emergencyInterest + longTermInterest + w.prepaymentPenalty
  const ebt = ebit + financialIncome - financialExpensesTotal

  const { taxLossUsed, tax } = applyTax(settings, s, ctx.cycle, ebt)
  move(w, 'OPERATING', 'incomeTax', -tax)
  const netIncome = ebt - tax
  s.equity.retainedEarnings += netIncome
  let legalReserveTransfer = 0
  if (fin.legalReserveEnabled && netIncome > 0) {
    const cap = fin.legalReserveCap * s.equity.shareCapital
    legalReserveTransfer = Math.max(0, Math.min(netIncome * fin.legalReserveRate, cap - s.equity.legalReserve))
    s.equity.legalReserve += legalReserveTransfer
    s.equity.retainedEarnings -= legalReserveTransfer
  }

  let emergencyLoan = 0
  if (s.cash < 0) {
    emergencyLoan = -s.cash * (1 + fin.emergencyBuffer)
    move(w, 'FINANCING', 'emergencyLoan', emergencyLoan)
    s.debt.emergency.principal = emergencyLoan
    s.emergencyStreak += 1
  } else {
    s.emergencyStreak = 0
  }

  const incomeStatement: IncomeStatement = {
    revenue: { ...revenue, total: revenueTotal },
    costOfSales: { ...costOfSales, total: costOfSalesTotal },
    grossProfit,
    operatingExpenses: { marketing, qualityImprovement, marketResearch, administrative, holding, idleCapacity: w.idleCapacity, total: opexTotal },
    ebit,
    depreciation: w.depreciation,
    ebitda: ebit + w.depreciation,
    financialIncome,
    financialExpenses: {
      shortTerm: shortTermInterest,
      emergency: w.emergencyInterest,
      longTerm: longTermInterest,
      prepaymentPenalty: w.prepaymentPenalty,
      total: financialExpensesTotal,
    },
    ebt,
    taxLossUsed,
    tax,
    netIncome,
    legalReserveTransfer,
  }

  const variableCosts = sum(PRODUCTS.map((p) => sold[p] * variableUnitCost(settings, p))) + adminVariable
  const fixedCosts = w.depreciation + marketing + qualityImprovement + marketResearch + adminFixed + holding
  const directCosting: DirectCostingStatement = {
    revenue: revenueTotal,
    variableCosts,
    contributionMargin: revenueTotal - variableCosts,
    fixedCosts,
    operatingIncome: revenueTotal - variableCosts - fixedCosts,
  }

  const balanceSheet = buildBalanceSheet(settings, s)
  const equity = balanceSheet.equity.total
  s.netIncomeHistory.push(netIncome)
  s.equityHistory.push(equity)
  const valuation = valuate(settings, s)
  s.sharePrice = valuation.sharePrice
  s.cycle = ctx.cycle
  s.lastSales = sold
  s.lastDemand = perProduct((p) => ctx.offerings[p]?.demand ?? 0)

  const insolvency =
    s.equity.retainedEarnings < 0 && -s.equity.retainedEarnings > settings.bankruptcy.insolvencyLossRatio * s.equity.shareCapital
  const bankrupt = equity < 0 || s.emergencyStreak >= settings.bankruptcy.emergencyStreakLimit
  if (bankrupt) {
    s.status = CompanyStatus.BANKRUPT
    s.bankruptCycle = ctx.cycle
  }

  const operations = {
    capacity: s.capacity.active,
    capacityNext: s.capacity.active + s.capacity.pending,
    utilization: s.capacity.active > 0 ? sum(PRODUCTS.map((p) => w.produced[p] * prod.capacityUsage[p])) / s.capacity.active : 0,
    production: { ...w.produced },
    materials: perProduct((p) => ({
      initial: w.materialsAtStart[p],
      used: w.produced[p],
      final: s.materials[p],
      ordered: d.production.materialPurchases[p],
      inTransit: s.materialsInTransit[p],
    })),
    finishedGoods: perProduct((p) => ({
      initial: w.finishedAtStart[p].units,
      produced: w.produced[p],
      sold: sold[p],
      final: layersUnits(s.finishedGoods[p]),
    })),
    unitCost: { ...w.unitCost },
    demand: perProduct((p) => ctx.offerings[p]?.demand ?? 0),
    sales: sold,
    lostSales: perProduct((p) => ctx.offerings[p]?.lostSales ?? 0),
    marketShare: { A: ctx.offerings.A?.share ?? 0, B: ctx.offerings.B?.share ?? 0, total: (ctx.offerings.A?.share ?? 0) + (ctx.offerings.B?.share ?? 0) },
    qualityIndex: { ...w.qualityIndex },
    marketingIndex: { ...w.marketingIndex },
    price: { ...d.marketing.price },
  }

  const indicators = computeIndicators(settings, s, w, incomeStatement, directCosting, balanceSheet, valuation, operations.utilization, sold)

  return {
    cycle: ctx.cycle,
    companyId: w.id,
    operations,
    incomeStatement,
    directCosting,
    balanceSheet,
    cashFlow: {
      opening: w.openingCash,
      moves: w.ledger,
      operating: sum(w.ledger.filter((m) => m.category === 'OPERATING').map((m) => m.amount)),
      investing: sum(w.ledger.filter((m) => m.category === 'INVESTING').map((m) => m.amount)),
      financing: sum(w.ledger.filter((m) => m.category === 'FINANCING').map((m) => m.amount)),
      closing: s.cash,
    },
    indicators,
    alerts: { insolvency, bankrupt, emergencyLoan, adjustments: w.adjustments },
  }
}

function applyTax(settings: GameSettings, s: CompanyState, cycle: number, ebt: number): { taxLossUsed: number; tax: number } {
  const { lossCarryForwardMaxCycles, lossCarryForwardMaxOffset, taxRate } = settings.finance
  s.taxLosses = s.taxLosses.filter((loss) => lossCarryForwardMaxCycles === null || cycle - loss.cycle <= lossCarryForwardMaxCycles)
  if (ebt <= 0) {
    if (ebt < 0) s.taxLosses.push({ cycle, amount: -ebt })
    return { taxLossUsed: 0, tax: 0 }
  }
  let offset = Math.min(ebt * lossCarryForwardMaxOffset, sum(s.taxLosses.map((loss) => loss.amount)))
  const taxLossUsed = offset
  s.taxLosses = s.taxLosses
    .map((loss) => {
      const used = Math.min(loss.amount, offset)
      offset -= used
      return { ...loss, amount: loss.amount - used }
    })
    .filter((loss) => loss.amount > 1e-6)
  return { taxLossUsed, tax: (ebt - taxLossUsed) * taxRate }
}

export function buildBalanceSheet(settings: GameSettings, s: CompanyState): BalanceSheet {
  const finishedGoods = perProduct((p) => layersValue(s.finishedGoods[p]))
  const materials = perProduct((p) => s.materials[p] * settings.production.materialCost[p])
  const materialsInTransit = sum(PRODUCTS.map((p) => s.materialsInTransit[p] * settings.production.materialCost[p]))
  const currentAssets =
    s.cash + s.securities.principal + s.securities.accruedYield + finishedGoods.A + finishedGoods.B + materials.A + materials.B + materialsInTransit
  const nonCurrentAssets = s.fixedAssets.gross - s.fixedAssets.accumulatedDepreciation + s.fixedAssets.inProgress
  const totalAssets = currentAssets + nonCurrentAssets

  const longTermCurrent = sum(s.debt.longTerm.map((loan) => principalDueWithin(loan, CURRENT_PORTION_QUARTERS)))
  const longTermTotal = sum(s.debt.longTerm.map((loan) => loan.balance))
  const currentLiabilities =
    s.debt.shortTerm.principal + s.debt.shortTerm.interest + s.debt.emergency.principal + longTermCurrent + s.debt.longTermInterestPayable
  const longTermNonCurrent = longTermTotal - longTermCurrent
  const totalLiabilities = currentLiabilities + longTermNonCurrent
  const equityTotal = totalEquity(s)

  return {
    assets: {
      cash: s.cash,
      securities: s.securities.principal,
      securitiesYieldReceivable: s.securities.accruedYield,
      finishedGoods,
      materials,
      materialsInTransit,
      currentTotal: currentAssets,
      fixedGross: s.fixedAssets.gross,
      accumulatedDepreciation: s.fixedAssets.accumulatedDepreciation,
      inProgress: s.fixedAssets.inProgress,
      nonCurrentTotal: nonCurrentAssets,
      total: totalAssets,
    },
    liabilities: {
      shortTermLoan: s.debt.shortTerm.principal,
      shortTermInterest: s.debt.shortTerm.interest,
      emergencyLoan: s.debt.emergency.principal,
      longTermCurrent,
      longTermInterest: s.debt.longTermInterestPayable,
      currentTotal: currentLiabilities,
      longTermNonCurrent,
      total: totalLiabilities,
    },
    equity: { ...s.equity, total: equityTotal },
    totalLiabilitiesAndEquity: totalLiabilities + equityTotal,
    balanced: Math.abs(totalAssets - totalLiabilities - equityTotal) < BALANCE_TOLERANCE,
  }
}

export interface Valuation {
  sharePrice: number
  bookValuePerShare: number
  priceToBook: number | null
  roeAnnual: number | null
  tsr: number
  roi: number
}

// Dampened residual income model: P/B moves with the ROE spread over the cost of equity, bounded to avoid extreme jumps
export function valuate(settings: GameSettings, s: CompanyState): Valuation {
  const equity = totalEquity(s)
  const bookValuePerShare = equity / s.shares
  const n = Math.min(4, s.netIncomeHistory.length)
  const recentIncome = sum(s.netIncomeHistory.slice(-n))
  const recentEquity = s.equityHistory.slice(-(n + 1))
  const avgEquity = recentEquity.length ? sum(recentEquity) / recentEquity.length : equity
  const roeAnnual = n > 0 && avgEquity > 0 ? (recentIncome / avgEquity) * (4 / n) : null
  const [minPb, maxPb] = settings.finance.priceToBookBounds
  const { costOfEquity, priceSensitivity } = settings.finance
  const priceToBook = roeAnnual === null ? 1 : clamp(1 + (priceSensitivity * (roeAnnual - costOfEquity)) / costOfEquity, minPb, maxPb)
  const sharePrice = equity <= 0 ? 0 : bookValuePerShare * priceToBook
  return {
    sharePrice,
    bookValuePerShare,
    priceToBook: equity <= 0 ? null : priceToBook,
    roeAnnual,
    tsr: (sharePrice + s.cumulativeDividendsPerShare) / s.initialSharePrice - 1,
    roi: (equity + s.cumulativeDividends - s.contributedCapital) / s.contributedCapital,
  }
}

// Annualized ROE over the whole game, used when the facilitator ranks by ROE
export function gameRoe(s: CompanyState): number {
  const cycles = s.netIncomeHistory.length
  if (!cycles) return 0
  const avgEquity = sum(s.equityHistory) / s.equityHistory.length
  return avgEquity > 0 ? (sum(s.netIncomeHistory) / avgEquity) * (4 / cycles) : -1
}

function computeIndicators(
  settings: GameSettings,
  s: CompanyState,
  w: WorkingCompany,
  is: IncomeStatement,
  dc: DirectCostingStatement,
  bs: BalanceSheet,
  valuation: Valuation,
  utilization: number,
  sold: PerProduct<number>,
): Indicators {
  const inventories = bs.assets.finishedGoods.A + bs.assets.finishedGoods.B + bs.assets.materials.A + bs.assets.materials.B + bs.assets.materialsInTransit
  const financialDebt = bs.liabilities.shortTermLoan + bs.liabilities.emergencyLoan + bs.liabilities.longTermCurrent + bs.liabilities.longTermNonCurrent
  const finishedStart = w.finishedAtStart.A.value + w.finishedAtStart.B.value
  const finishedEnd = bs.assets.finishedGoods.A + bs.assets.finishedGoods.B
  const turnover = safeDiv(is.costOfSales.total, (finishedStart + finishedEnd) / 2)
  const contributionMarginPerUnit = perProduct((p) => w.decisions.marketing.price[p] - variableUnitCost(settings, p))
  const soldTotal = sold.A + sold.B
  const mix = soldTotal > 0 ? perProduct((p) => sold[p] / soldTotal) : { A: 0.5, B: 0.5 }
  const weightedCm = mix.A * contributionMarginPerUnit.A + mix.B * contributionMarginPerUnit.B
  const fixedForBreakEven = dc.fixedCosts + is.financialExpenses.total
  return {
    currentRatio: safeDiv(bs.assets.currentTotal, bs.liabilities.currentTotal),
    quickRatio: safeDiv(bs.assets.currentTotal - inventories, bs.liabilities.currentTotal),
    workingCapital: bs.assets.currentTotal - bs.liabilities.currentTotal,
    debtToEquity: safeDiv(financialDebt, bs.equity.total),
    debtToAssets: safeDiv(bs.liabilities.total, bs.assets.total),
    interestCoverage: safeDiv(is.ebit, is.financialExpenses.total),
    grossMargin: safeDiv(is.grossProfit, is.revenue.total),
    operatingMargin: safeDiv(is.ebit, is.revenue.total),
    netMargin: safeDiv(is.netIncome, is.revenue.total),
    roa: safeDiv(is.netIncome, bs.assets.total),
    roe: safeDiv(is.netIncome, bs.equity.total),
    roeAnnual: valuation.roeAnnual,
    roi: valuation.roi,
    inventoryTurnover: turnover,
    inventoryDays: turnover ? QUARTER_DAYS / turnover : null,
    capacityUtilization: utilization,
    breakEvenUnits: weightedCm > 0 ? Math.ceil(fixedForBreakEven / weightedCm) : null,
    contributionMarginPerUnit,
    eps: is.netIncome / s.shares,
    bookValuePerShare: valuation.bookValuePerShare,
    sharePrice: valuation.sharePrice,
    priceToBook: valuation.priceToBook,
    dividendsPerShare: w.decisions.finance.dividends / s.shares,
    tsr: valuation.tsr,
  }
}
