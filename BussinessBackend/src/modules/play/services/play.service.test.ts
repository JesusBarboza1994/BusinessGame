import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { vi } from 'vitest'

import { PlayService } from './play.service'
import { CompanyDbRepository } from '@/db/company/company-db.repository'
import { CycleResultDbRepository } from '@/db/cycle-result/cycle-result-db.repository'
import { DecisionDbRepository } from '@/db/decision/decision-db.repository'
import { GameDbRepository } from '@/db/game/game-db.repository'
import { MarketResultDbRepository } from '@/db/market-result/market-result-db.repository'
import { LiveGateway } from '@/modules/live/gateway/live.gateway'
import { SimulationService } from '@/modules/simulation/services/simulation.service'

import { mockCompany, mockGame, mockGameId } from '@/modules/simulation/mocks/simulation.mock'

import { GameStatus } from '@/commons/constants/game.constant'
import { defaultDecisions } from '@/modules/simulation/engine/decisions.engine'
import { DEFAULT_GAME_SETTINGS } from '@/modules/simulation/engine/engine.constant'
import { ValuationMethod } from '@/modules/simulation/engine/engine.types'

import { CompanyNameTakenException } from '@/commons/exceptions/company/company-name-taken.exception'
import { DecisionInvalidException } from '@/commons/exceptions/decision/decision-invalid.exception'
import { CycleNotOpenException } from '@/commons/exceptions/game/cycle-not-open.exception'
import { GameNotInLobbyException } from '@/commons/exceptions/game/game-not-in-lobby.exception'

const companyId = '65f0000000000000000000a1'
const player = { companyId, gameId: mockGameId }
const gameRepository = { findById: vi.fn(), findByPin: vi.fn() }
const companyRepository = { findById: vi.fn(), findByGameId: vi.fn(), countByGameId: vi.fn(), existsByGameIdAndName: vi.fn(), create: vi.fn() }
const decisionRepository = { upsert: vi.fn(), findByCompanyIdAndCycle: vi.fn() }
const simulationService = { registerSubmission: vi.fn() }
const liveGateway = { notifyLobbyUpdated: vi.fn() }

describe('PlayService', () => {
  let service: PlayService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayService,
        { provide: GameDbRepository, useValue: gameRepository },
        { provide: CompanyDbRepository, useValue: companyRepository },
        { provide: DecisionDbRepository, useValue: decisionRepository },
        { provide: CycleResultDbRepository, useValue: {} },
        { provide: MarketResultDbRepository, useValue: {} },
        { provide: SimulationService, useValue: simulationService },
        { provide: LiveGateway, useValue: liveGateway },
        { provide: ConfigService, useValue: { get: () => ({ playerTokenTtlHours: 24 }) } },
      ],
    }).compile()
    service = module.get(PlayService)
    companyRepository.findById.mockResolvedValue(mockCompany(companyId))
    companyRepository.findByGameId.mockResolvedValue([mockCompany(companyId)])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('rejects joining a game that already started', async () => {
    gameRepository.findByPin.mockResolvedValue(mockGame())

    await expect(
      service.join({ pin: '123456', companyName: 'Alfa', avatar: '🚀', color: '#123456', valuationMethod: ValuationMethod.FIFO }),
    ).rejects.toThrow(GameNotInLobbyException)
  })

  it('rejects a duplicated company name', async () => {
    gameRepository.findByPin.mockResolvedValue(mockGame({ status: GameStatus.LOBBY }))
    companyRepository.countByGameId.mockResolvedValue(1)
    companyRepository.existsByGameIdAndName.mockResolvedValue(true)

    await expect(
      service.join({ pin: '123456', companyName: 'Alfa', avatar: '🚀', color: '#123456', valuationMethod: ValuationMethod.FIFO }),
    ).rejects.toThrow(CompanyNameTakenException)
  })

  it('returns a token and stores only its hash when joining', async () => {
    gameRepository.findByPin.mockResolvedValue(mockGame({ status: GameStatus.LOBBY }))
    companyRepository.countByGameId.mockResolvedValue(0)
    companyRepository.existsByGameIdAndName.mockResolvedValue(false)
    companyRepository.create.mockResolvedValue(mockCompany(companyId))

    const result = await service.join({ pin: '123456', companyName: 'Alfa', avatar: '🚀', color: '#123456', valuationMethod: ValuationMethod.FIFO })

    expect(result.playerToken).toHaveLength(64)
    expect(companyRepository.create.mock.calls[0][0].playerTokenHash).not.toBe(result.playerToken)
    expect(liveGateway.notifyLobbyUpdated).toHaveBeenCalled()
  })

  it('refuses infeasible decisions on submit', async () => {
    gameRepository.findById.mockResolvedValue(mockGame())
    const decisions = defaultDecisions(DEFAULT_GAME_SETTINGS)
    decisions.production.units.A = 10_000

    await expect(service.submit(player, decisions)).rejects.toThrow(DecisionInvalidException)
    expect(decisionRepository.upsert).not.toHaveBeenCalled()
  })

  it('stores feasible decisions and notifies the simulation', async () => {
    gameRepository.findById.mockResolvedValue(mockGame())

    const validation = await service.submit(player, defaultDecisions(DEFAULT_GAME_SETTINGS))

    expect(validation.valid).toBe(true)
    expect(decisionRepository.upsert).toHaveBeenCalledWith(expect.objectContaining({ submitted: true, cycle: 1 }))
    expect(simulationService.registerSubmission).toHaveBeenCalledWith(mockGameId, 1)
  })

  it('does not accept decisions while the cycle is processing', async () => {
    gameRepository.findById.mockResolvedValue(mockGame({ cycleStatus: 'PROCESSING' as never }))

    await expect(service.submit(player, defaultDecisions(DEFAULT_GAME_SETTINGS))).rejects.toThrow(CycleNotOpenException)
  })
})
