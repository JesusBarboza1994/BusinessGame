import { CycleStatus, GameStatus } from '@/commons/constants/game.constant'

import { EconomySeries, GameSettings, MarketState, RankingEntry } from '@/modules/simulation/engine/engine.types'

export interface GameDbDto {
  id: string
  facilitatorId: string
  name: string
  pin: string
  status: GameStatus
  settings: GameSettings
  cycleDurationMinutes: number
  currentCycle: number
  cycleStatus: CycleStatus
  cycleDeadline: Date | null
  economy: EconomySeries | null
  marketState: MarketState | null
  ranking: RankingEntry[]
  startedAt: Date | null
  finishedAt: Date | null
  createdAt: Date
}

export interface CreateGameDbDto {
  facilitatorId: string
  name: string
  pin: string
  settings: GameSettings
  cycleDurationMinutes: number
}

export interface UpdateGameDbDto {
  status?: GameStatus
  currentCycle?: number
  cycleStatus?: CycleStatus
  cycleDeadline?: Date | null
  economy?: EconomySeries
  marketState?: MarketState
  ranking?: RankingEntry[]
  startedAt?: Date
  finishedAt?: Date
}
