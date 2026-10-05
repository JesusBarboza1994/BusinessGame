import { CycleStatus, GameStatus } from '@/commons/constants/game.constant'

import { NamedRankingEntry } from '@/commons/helpers/ranking.helper'
import {
  CompanyDecisions,
  CompanyStatus,
  CycleReport,
  GameSettings,
  PerProduct,
  ValuationMethod,
} from '@/modules/simulation/engine/engine.types'
import { MarketResearchReport } from '@/modules/simulation/engine/market-research.engine'
import { DecisionValidation } from '@/modules/simulation/engine/validation.engine'

export interface LobbyInfoResponseDto {
  id: string
  name: string
  status: GameStatus
  totalCycles: number
  cycleDurationMinutes: number
  companies: { id: string; name: string; avatar: string; color: string; isBot: boolean }[]
}

export interface JoinGameResponseDto {
  playerToken: string
  companyId: string
  gameId: string
}

export type DecisionSource = 'SUBMITTED' | 'DRAFT' | 'REPEAT' | 'DEFAULT' | 'AUTO'

export interface CompanySnapshotDto {
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

export interface HistoryEntryDto {
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

export interface IndustryInfoDto {
  cycle: number
  economyIndex: number
  totalSales: PerProduct<number>
  averagePrice: PerProduct<number>
  marketSize: number
}

export type PlayerRules = Pick<GameSettings, 'cycles' | 'production' | 'costs' | 'finance' | 'initial' | 'rankingMetric'> & {
  refPrice: PerProduct<number>
  longTermQuarterlyRate: number
}

export interface PlayerDashboardResponseDto {
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
  snapshot: CompanySnapshotDto
  economy: { current: number; forecastNextQuarter: number | null; forecastNextYear: number | null; history: number[] }
  decision: { cycle: number; decisions: CompanyDecisions; submitted: boolean; source: DecisionSource } | null
  validation: DecisionValidation | null
  lastReport: CycleReport | null
  history: HistoryEntryDto[]
  ranking: NamedRankingEntry[]
  industry: IndustryInfoDto[]
  rules: PlayerRules
}

export interface PlayerCycleReportResponseDto {
  cycle: number
  report: CycleReport
  appliedDecisions: CompanyDecisions
  autoDecisions: boolean
  marketResearch: (MarketResearchReport & { names: Record<string, { name: string; avatar: string; color: string; isBot: boolean }> }) | null
  industry: IndustryInfoDto
  ranking: NamedRankingEntry[]
}
