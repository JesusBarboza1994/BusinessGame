import { CycleStatus, GameStatus } from '@/commons/constants/game.constant'
import { CompanyDbDto } from '@/db/company/company-db.dto'
import { GameDbDto } from '@/db/game/game-db.dto'
import { createInitialCompanyState } from '../engine/company.engine'
import { createInitialMarketState } from '../engine/cycle.engine'
import { generateEconomy } from '../engine/economy.engine'
import { DEFAULT_GAME_SETTINGS } from '../engine/engine.constant'
import { CompanyStatus, ValuationMethod } from '../engine/engine.types'

export const mockGameId = '65f000000000000000000001'
export const mockFacilitatorId = '65f0000000000000000000ff'

export const mockGame = (overrides: Partial<GameDbDto> = {}): GameDbDto => {
  const settings = { ...structuredClone(DEFAULT_GAME_SETTINGS), cycles: 2 }
  return {
    id: mockGameId,
    facilitatorId: mockFacilitatorId,
    name: 'Test game',
    pin: '123456',
    status: GameStatus.IN_PROGRESS,
    settings,
    cycleDurationMinutes: 5,
    currentCycle: 1,
    cycleStatus: CycleStatus.OPEN,
    cycleDeadline: new Date(Date.now() + 60_000),
    economy: generateEconomy(settings),
    marketState: createInitialMarketState(2),
    ranking: [],
    startedAt: new Date(),
    finishedAt: null,
    createdAt: new Date(),
    ...overrides,
  }
}

export const mockCompany = (id: string, overrides: Partial<CompanyDbDto> = {}): CompanyDbDto => ({
  id,
  gameId: mockGameId,
  name: `Company ${id.slice(-2)}`,
  avatar: '🚀',
  color: '#123456',
  tokenExpiresAt: new Date(Date.now() + 3_600_000),
  valuationMethod: ValuationMethod.WEIGHTED_AVERAGE,
  status: CompanyStatus.ACTIVE,
  state: createInitialCompanyState(DEFAULT_GAME_SETTINGS, ValuationMethod.WEIGHTED_AVERAGE),
  isBot: false,
  botProfile: null,
  createdAt: new Date(),
  ...overrides,
})
