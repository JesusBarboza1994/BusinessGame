export type Product = 'A' | 'B'
export type PerProduct<T> = Record<Product, T>
export type Segment = 'PRICE' | 'QUALITY'

export enum ValuationMethod {
  WEIGHTED_AVERAGE = 'WEIGHTED_AVERAGE',
  FIFO = 'FIFO',
}

export enum PrepaymentMode {
  REDUCE_INSTALLMENT = 'REDUCE_INSTALLMENT',
  REDUCE_TERM = 'REDUCE_TERM',
}

export enum RankingMetric {
  TSR = 'TSR',
  ROI = 'ROI',
  ROE = 'ROE',
}

export enum CompanyStatus {
  ACTIVE = 'ACTIVE',
  BANKRUPT = 'BANKRUPT',
}

export enum BotStrategy {
  BALANCED = 'BALANCED',
  LOW_COST = 'LOW_COST',
  PREMIUM = 'PREMIUM',
  GROWTH = 'GROWTH',
}

export enum BotLevel {
  EASY = 'EASY',
  NORMAL = 'NORMAL',
  HARD = 'HARD',
}

export interface BotProfile {
  strategy: BotStrategy
  level: BotLevel
}

export interface SegmentSettings {
  weight: number
  quality: number
  marketing: number
  price: number
}

export interface GameSettings {
  cycles: number
  seed: number
  initial: {
    cash: number
    capacity: number
    materials: PerProduct<number>
    shares: number
    shareParValue: number
  }
  production: {
    moduleUnits: number
    moduleCostPerUnit: number
    depreciationRate: number
    materialCost: PerProduct<number>
    laborCost: PerProduct<number>
    variableOverhead: PerProduct<number>
    capacityUsage: PerProduct<number>
  }
  market: {
    targetUtilization: number
    growth: number
    growthNoise: number
    elasticity: number
    refPrice: PerProduct<number>
    baseQuality: PerProduct<number>
    qualityDecay: number
    marketingDecay: number
    qualityHalfSaturation: number
    marketingHalfSaturation: number
    noiseSigma: number
    substitutionRate: number
    latentDemandRate: number
    stockoutReputationLoss: number
    segments: Record<Segment, SegmentSettings>
    economySegmentShift: number
    priceSegmentBounds: [number, number]
  }
  economy: {
    drift: number
    volatility: number
    forecastNoiseQuarter: number
    forecastNoiseYear: number
  }
  costs: {
    adminFixed: number
    adminVariableRate: number
    adminNoise: number
    holdingCost: { finished: number; materials: number }
    marketResearchCost: number
  }
  finance: {
    shortTermRate: number
    emergencyRate: number
    emergencyBuffer: number
    longTermAnnualRate: number
    longTermQuarters: number
    prepaymentPenalty: number
    creditLimitMultiple: number
    securitiesRate: number
    taxRate: number
    lossCarryForwardMaxCycles: number | null
    lossCarryForwardMaxOffset: number
    issueDiscount: number
    issueCost: number
    costOfEquity: number
    legalReserveEnabled: boolean
    legalReserveRate: number
    legalReserveCap: number
    priceToBookBounds: [number, number]
    priceSensitivity: number
  }
  bankruptcy: {
    emergencyStreakLimit: number
    insolvencyLossRatio: number
  }
  rankingMetric: RankingMetric
}

export interface CompanyDecisions {
  production: {
    units: PerProduct<number>
    materialPurchases: PerProduct<number>
    capacityModules: number
  }
  marketing: {
    price: PerProduct<number>
    advertising: PerProduct<number>
    buyMarketResearch: boolean
  }
  research: {
    quality: PerProduct<number>
  }
  finance: {
    shortTermLoan: number
    longTermLoan: number
    prepayment: { amount: number; mode: PrepaymentMode }
    sharesToIssue: number
    dividends: number
    securitiesPurchase: number
  }
}

export interface InventoryLayer {
  units: number
  unitCost: number
}

export interface LongTermLoan {
  id: string
  originCycle: number
  principal: number
  balance: number
  rate: number
  remainingQuarters: number
  installment: number
}

export interface TaxLoss {
  cycle: number
  amount: number
}

export interface CompanyState {
  cycle: number
  status: CompanyStatus
  bankruptCycle: number | null
  valuationMethod: ValuationMethod
  cash: number
  securities: { principal: number; accruedYield: number }
  finishedGoods: PerProduct<InventoryLayer[]>
  materials: PerProduct<number>
  materialsInTransit: PerProduct<number>
  capacity: { active: number; pending: number }
  fixedAssets: { gross: number; accumulatedDepreciation: number; inProgress: number }
  debt: {
    shortTerm: { principal: number; interest: number }
    emergency: { principal: number }
    longTerm: LongTermLoan[]
    longTermInterestPayable: number
  }
  equity: { shareCapital: number; additionalCapital: number; legalReserve: number; retainedEarnings: number }
  shares: number
  taxLosses: TaxLoss[]
  qualityStock: PerProduct<number>
  marketingStock: PerProduct<number>
  emergencyStreak: number
  netIncomeHistory: number[]
  equityHistory: number[]
  contributedCapital: number
  cumulativeDividends: number
  cumulativeDividendsPerShare: number
  initialSharePrice: number
  sharePrice: number
  lastSales: PerProduct<number>
  lastDemand: PerProduct<number>
}

export interface EconomySeries {
  index: number[]
  forecastNextQuarter: number[]
  forecastNextYear: number[]
}

export interface MarketState {
  cycle: number
  growthIndex: number
  latentDemand: number
  initialCompanies: number
}

export interface OfferingResult {
  companyId: string
  product: Product
  price: number
  advertising: number
  qualityIndex: number
  marketingIndex: number
  attractiveness: Record<Segment, number>
  demand: number
  demandBySegment: Record<Segment, number>
  sales: number
  lostSales: number
  share: number
}

export interface MarketCycleResult {
  cycle: number
  economyIndex: number
  growthIndex: number
  priceIndex: number
  marketSize: number
  latentDemandIn: number
  latentDemandOut: number
  segmentWeights: Record<Segment, number>
  segmentDemand: Record<Segment, number>
  averagePrice: PerProduct<number>
  totalSales: PerProduct<number>
  unservedDemand: number
  offerings: OfferingResult[]
}

export type CashCategory = 'OPERATING' | 'INVESTING' | 'FINANCING'

export interface CashMove {
  category: CashCategory
  concept: string
  amount: number
}

export interface DecisionAdjustment {
  code: string
  field: string
  requested: number
  applied: number
}

export interface IncomeStatement {
  revenue: PerProduct<number> & { total: number }
  costOfSales: PerProduct<number> & { total: number }
  grossProfit: number
  operatingExpenses: {
    marketing: number
    qualityImprovement: number
    marketResearch: number
    administrative: number
    holding: number
    idleCapacity: number
    total: number
  }
  ebit: number
  depreciation: number
  ebitda: number
  financialIncome: number
  financialExpenses: {
    shortTerm: number
    emergency: number
    longTerm: number
    prepaymentPenalty: number
    total: number
  }
  ebt: number
  taxLossUsed: number
  tax: number
  netIncome: number
  legalReserveTransfer: number
}

export interface DirectCostingStatement {
  revenue: number
  variableCosts: number
  contributionMargin: number
  fixedCosts: number
  operatingIncome: number
}

export interface BalanceSheet {
  assets: {
    cash: number
    securities: number
    securitiesYieldReceivable: number
    finishedGoods: PerProduct<number>
    materials: PerProduct<number>
    materialsInTransit: number
    currentTotal: number
    fixedGross: number
    accumulatedDepreciation: number
    inProgress: number
    nonCurrentTotal: number
    total: number
  }
  liabilities: {
    shortTermLoan: number
    shortTermInterest: number
    emergencyLoan: number
    longTermCurrent: number
    longTermInterest: number
    currentTotal: number
    longTermNonCurrent: number
    total: number
  }
  equity: {
    shareCapital: number
    additionalCapital: number
    legalReserve: number
    retainedEarnings: number
    total: number
  }
  totalLiabilitiesAndEquity: number
  balanced: boolean
}

export interface CashFlowStatement {
  opening: number
  moves: CashMove[]
  operating: number
  investing: number
  financing: number
  closing: number
}

export interface OperationsReport {
  capacity: number
  capacityNext: number
  utilization: number
  production: PerProduct<number>
  materials: PerProduct<{ initial: number; used: number; final: number; ordered: number; inTransit: number }>
  finishedGoods: PerProduct<{ initial: number; produced: number; sold: number; final: number }>
  unitCost: PerProduct<number>
  demand: PerProduct<number>
  sales: PerProduct<number>
  lostSales: PerProduct<number>
  marketShare: PerProduct<number> & { total: number }
  qualityIndex: PerProduct<number>
  marketingIndex: PerProduct<number>
  price: PerProduct<number>
}

export interface Indicators {
  currentRatio: number | null
  quickRatio: number | null
  workingCapital: number
  debtToEquity: number | null
  debtToAssets: number | null
  interestCoverage: number | null
  grossMargin: number | null
  operatingMargin: number | null
  netMargin: number | null
  roa: number | null
  roe: number | null
  roeAnnual: number | null
  roi: number
  inventoryTurnover: number | null
  inventoryDays: number | null
  capacityUtilization: number
  breakEvenUnits: number | null
  contributionMarginPerUnit: PerProduct<number>
  eps: number
  bookValuePerShare: number
  sharePrice: number
  priceToBook: number | null
  dividendsPerShare: number
  tsr: number
}

export interface CompanyAlerts {
  insolvency: boolean
  bankrupt: boolean
  emergencyLoan: number
  adjustments: DecisionAdjustment[]
}

export interface CycleReport {
  cycle: number
  companyId: string
  operations: OperationsReport
  incomeStatement: IncomeStatement
  directCosting: DirectCostingStatement
  balanceSheet: BalanceSheet
  cashFlow: CashFlowStatement
  indicators: Indicators
  alerts: CompanyAlerts
}

export interface RankingEntry {
  position: number
  companyId: string
  status: CompanyStatus
  score: number
  sharePrice: number
  tsr: number
  roi: number
  roeAnnual: number | null
  marketShare: number
  equity: number
}

export interface CycleCompanyInput {
  id: string
  state: CompanyState
  decisions: CompanyDecisions
}

export interface CycleInput {
  settings: GameSettings
  cycle: number
  market: MarketState
  economy: EconomySeries
  companies: CycleCompanyInput[]
}

export interface CycleCompanyOutput {
  id: string
  state: CompanyState
  report: CycleReport | null
  appliedDecisions: CompanyDecisions | null
}

export interface CycleOutput {
  market: MarketState
  marketResult: MarketCycleResult
  companies: CycleCompanyOutput[]
  ranking: RankingEntry[]
}
