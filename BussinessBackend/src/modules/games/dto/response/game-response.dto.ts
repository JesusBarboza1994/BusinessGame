import { CycleStatus, GameStatus } from '@/commons/constants/game.constant'

import { NamedRankingEntry } from '@/commons/helpers/ranking.helper'
import { BotProfile, CompanyStatus, CycleReport, GameSettings, MarketCycleResult, ValuationMethod } from '@/modules/simulation/engine/engine.types'

export interface GameSummaryResponseDto {
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

export interface GameCompanyResponseDto {
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
}

export interface MarketHistoryEntryDto {
  cycle: number
  marketSize: number
  economyIndex: number
  totalSales: { A: number; B: number }
  averagePrice: { A: number; B: number }
  unservedDemand: number
}

export interface GameDetailResponseDto extends GameSummaryResponseDto {
  serverTime: string
  settings: GameSettings
  companiesDetail: GameCompanyResponseDto[]
  ranking: NamedRankingEntry[]
  marketHistory: MarketHistoryEntryDto[]
  economyHistory: number[]
}

export interface CycleDetailResponseDto {
  cycle: number
  market: MarketCycleResult
  ranking: NamedRankingEntry[]
  companies: { id: string; name: string; avatar: string; color: string; isBot: boolean; autoDecisions: boolean; report: CycleReport }[]
}

export interface DefaultSettingsResponseDto {
  settings: GameSettings
  presets: { id: string; name: string; description: string; cycles: number; cycleDurationMinutes: number }[]
}
