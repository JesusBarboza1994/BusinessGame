import { MarketCycleResult, RankingEntry } from '@/modules/simulation/engine/engine.types'

export interface MarketResultDbDto {
  id: string
  gameId: string
  cycle: number
  result: MarketCycleResult
  ranking: RankingEntry[]
}

export interface CreateMarketResultDbDto {
  gameId: string
  cycle: number
  result: MarketCycleResult
  ranking: RankingEntry[]
}
