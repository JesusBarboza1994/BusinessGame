// Mirrors the API contracts of BussinessBackend (see src/modules/*/dto and simulation/engine/engine.types.ts)

export type Product = 'A' | 'B'
export type PerProduct<T> = Record<Product, T>
export type Segment = 'PRICE' | 'QUALITY'
export type ValuationMethod = 'WEIGHTED_AVERAGE' | 'FIFO'
export type PrepaymentMode = 'REDUCE_INSTALLMENT' | 'REDUCE_TERM'
export type GameStatus = 'LOBBY' | 'IN_PROGRESS' | 'FINISHED'
export type CycleStatus = 'OPEN' | 'PROCESSING' | 'CLOSED'
export type CompanyStatus = 'ACTIVE' | 'BANKRUPT'
export type RankingMetric = 'TSR' | 'ROI' | 'ROE'
export type BotStrategy = 'BALANCED' | 'LOW_COST' | 'PREMIUM' | 'GROWTH'
export type BotLevel = 'EASY' | 'NORMAL' | 'HARD'
export interface BotProfile {
  strategy: BotStrategy
  level: BotLevel
}

export interface CompanyDecisions {
  production: { units: PerProduct<number>; materialPurchases: PerProduct<number>; capacityModules: number }
  marketing: { price: PerProduct<number>; advertising: PerProduct<number>; buyMarketResearch: boolean }
  research: { quality: PerProduct<number> }
  finance: {
    shortTermLoan: number
    longTermLoan: number
    prepayment: { amount: number; mode: PrepaymentMode }
    sharesToIssue: number
    dividends: number
    securitiesPurchase: number
  }
}

export interface DecisionIssue {
  code: string
  field: string
  severity: 'error' | 'warning'
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
  financialExpenses: { shortTerm: number; emergency: number; longTerm: number; prepaymentPenalty: number; total: number }
  ebt: number
  taxLossUsed: number
  tax: number
  netIncome: number
  legalReserveTransfer: number
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
  equity: { shareCapital: number; additionalCapital: number; legalReserve: number; retainedEarnings: number; total: number }
  totalLiabilitiesAndEquity: number
  balanced: boolean
}

export interface CashMove {
  category: 'OPERATING' | 'INVESTING' | 'FINANCING'
  concept: string
  amount: number
}

export interface CycleReport {
  cycle: number
  companyId: string
  operations: {
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
  incomeStatement: IncomeStatement
  directCosting: { revenue: number; variableCosts: number; contributionMargin: number; fixedCosts: number; operatingIncome: number }
  balanceSheet: BalanceSheet
  cashFlow: { opening: number; moves: CashMove[]; operating: number; investing: number; financing: number; closing: number }
  indicators: {
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
  alerts: {
    insolvency: boolean
    bankrupt: boolean
    emergencyLoan: number
    adjustments: { code: string; field: string; requested: number; applied: number }[]
  }
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
  name: string
  avatar: string
  color: string
  isBot: boolean
}

export interface IndustryInfo {
  cycle: number
  economyIndex: number
  totalSales: PerProduct<number>
  averagePrice: PerProduct<number>
  marketSize: number
}

export interface HistoryEntry {
  cycle: number
  revenue: number
  netIncome: number
  cash: number
  equity: number
  sharePrice: number
  marketShare: number
  sales: PerProduct<number>
  demand: PerProduct<number>
  price: PerProduct<number>
  position: number | null
}

export interface PlayerRules {
  cycles: number
  production: {
    moduleUnits: number
    moduleCostPerUnit: number
    depreciationRate: number
    materialCost: PerProduct<number>
    laborCost: PerProduct<number>
    variableOverhead: PerProduct<number>
    capacityUsage: PerProduct<number>
  }
  costs: { adminFixed: number; adminVariableRate: number; holdingCost: { finished: number; materials: number }; marketResearchCost: number }
  finance: {
    shortTermRate: number
    emergencyRate: number
    longTermAnnualRate: number
    longTermQuarters: number
    prepaymentPenalty: number
    creditLimitMultiple: number
    securitiesRate: number
    taxRate: number
    issueDiscount: number
    issueCost: number
    costOfEquity: number
  }
  initial: { cash: number; capacity: number; shares: number; shareParValue: number }
  rankingMetric: RankingMetric
  refPrice: PerProduct<number>
  longTermQuarterlyRate: number
}

export type DecisionSource = 'SUBMITTED' | 'DRAFT' | 'REPEAT' | 'DEFAULT' | 'AUTO'

export interface PlayerDashboard {
  serverTime: string
  game: {
    id: string
    name: string
    status: GameStatus
    currentCycle: number
    totalCycles: number
    cycleStatus: CycleStatus
    cycleDeadline: string | null
    cycleDurationMinutes: number
    submitted: number
    activeCompanies: number
    bots: number
  }
  company: { id: string; name: string; avatar: string; color: string; status: CompanyStatus; valuationMethod: ValuationMethod; bankruptCycle: number | null }
  snapshot: {
    cash: number
    capacity: number
    capacityPending: number
    materials: PerProduct<number>
    materialsInTransit: PerProduct<number>
    finishedGoods: PerProduct<number>
    equity: number
    retainedEarnings: number
    sharePrice: number
    shares: number
    securities: number
    debt: { shortTerm: number; longTerm: number; emergency: number; longTermInstallment: number }
    qualityIndex: PerProduct<number>
    marketingIndex: PerProduct<number>
    emergencyStreak: number
  }
  economy: { current: number; forecastNextQuarter: number | null; forecastNextYear: number | null; history: number[] }
  decision: { cycle: number; decisions: CompanyDecisions; submitted: boolean; source: DecisionSource } | null
  validation: DecisionValidation | null
  lastReport: CycleReport | null
  history: HistoryEntry[]
  ranking: RankingEntry[]
  industry: IndustryInfo[]
  rules: PlayerRules
}

export interface MarketResearch {
  cycle: number
  marketSize: number
  segmentDemand: Record<Segment, number>
  segmentWeights: Record<Segment, number>
  unservedDemand: number
  nextMarketSizeForecast: number
  competitors: {
    companyId: string
    product: Product
    price: number
    estimatedAdvertising: number
    share: number
    sales: number
    shareBySegment: Record<Segment, number>
    qualityRank: number
  }[]
  names: Record<string, { name: string; avatar: string; color: string; isBot: boolean }>
}

export interface PlayerCycleReport {
  cycle: number
  report: CycleReport
  appliedDecisions: CompanyDecisions
  autoDecisions: boolean
  marketResearch: MarketResearch | null
  industry: IndustryInfo
  ranking: RankingEntry[]
}

export interface LobbyInfo {
  id: string
  name: string
  status: GameStatus
  totalCycles: number
  cycleDurationMinutes: number
  companies: { id: string; name: string; avatar: string; color: string; isBot: boolean }[]
}

export interface GameSummary {
  id: string
  name: string
  pin: string
  status: GameStatus
  currentCycle: number
  totalCycles: number
  cycleStatus: CycleStatus
  cycleDeadline: string | null
  cycleDurationMinutes: number
  companies: number
  createdAt: string
}

export interface MarketCycleResult {
  cycle: number
  economyIndex: number
  marketSize: number
  segmentWeights: Record<Segment, number>
  segmentDemand: Record<Segment, number>
  averagePrice: PerProduct<number>
  totalSales: PerProduct<number>
  unservedDemand: number
  offerings: {
    companyId: string
    product: Product
    price: number
    advertising: number
    qualityIndex: number
    marketingIndex: number
    demand: number
    sales: number
    lostSales: number
    share: number
  }[]
}

export interface GameDetail extends GameSummary {
  serverTime: string
  settings: Record<string, unknown> & { cycles: number; rankingMetric: RankingMetric }
  companiesDetail: {
    id: string
    name: string
    avatar: string
    color: string
    status: CompanyStatus
    valuationMethod: ValuationMethod
    isBot: boolean
    botProfile: BotProfile | null
    submitted: boolean
    cash: number
    sharePrice: number
  }[]
  ranking: RankingEntry[]
  marketHistory: {
    cycle: number
    marketSize: number
    economyIndex: number
    totalSales: PerProduct<number>
    averagePrice: PerProduct<number>
    unservedDemand: number
  }[]
  economyHistory: number[]
}

export interface CycleDetail {
  cycle: number
  market: MarketCycleResult
  ranking: RankingEntry[]
  companies: { id: string; name: string; avatar: string; color: string; isBot: boolean; autoDecisions: boolean; report: CycleReport }[]
}

export interface GamePreset {
  id: string
  name: string
  description: string
  cycles: number
  cycleDurationMinutes: number
}
