import { Test, TestingModule } from '@nestjs/testing'
import { vi } from 'vitest'

import { SimulationService } from './simulation.service'
import { CompanyDbRepository } from '@/db/company/company-db.repository'
import { CycleResultDbRepository } from '@/db/cycle-result/cycle-result-db.repository'
import { DecisionDbRepository } from '@/db/decision/decision-db.repository'
import { GameDbRepository } from '@/db/game/game-db.repository'
import { MarketResultDbRepository } from '@/db/market-result/market-result-db.repository'
import { LiveGateway } from '@/modules/live/gateway/live.gateway'
import { CycleProducer } from '@/queues/producers/cycle.producer'

import { mockCompany, mockGame, mockGameId } from '../mocks/simulation.mock'

import { CycleCloseReason, CycleStatus, GameStatus } from '@/commons/constants/game.constant'
import { BotLevel, BotStrategy } from '../engine/engine.types'

const gameRepository = { updateCycleStatus: vi.fn(), updateById: vi.fn() }
const companyRepository = { findByGameId: vi.fn(), updateState: vi.fn() }
const decisionRepository = { findByGameIdAndCycle: vi.fn(), upsert: vi.fn() }
const cycleResultRepository = { findByGameIdAndCycle: vi.fn(), createMany: vi.fn() }
const marketResultRepository = { create: vi.fn(), findByGameIdAndCycle: vi.fn() }
const cycleProducer = { scheduleDeadline: vi.fn(), closeNow: vi.fn() }
const liveGateway = {
  notifyCycleProcessing: vi.fn(),
  notifyCycleClosed: vi.fn(),
  notifyDecisionSubmitted: vi.fn(),
  notifyGameStarted: vi.fn(),
}

describe('SimulationService', () => {
  let service: SimulationService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulationService,
        { provide: GameDbRepository, useValue: gameRepository },
        { provide: CompanyDbRepository, useValue: companyRepository },
        { provide: DecisionDbRepository, useValue: decisionRepository },
        { provide: CycleResultDbRepository, useValue: cycleResultRepository },
        { provide: MarketResultDbRepository, useValue: marketResultRepository },
        { provide: CycleProducer, useValue: cycleProducer },
        { provide: LiveGateway, useValue: liveGateway },
      ],
    }).compile()
    service = module.get(SimulationService)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('skips a cycle that another worker already took', async () => {
    gameRepository.updateCycleStatus.mockResolvedValue(null)

    await service.closeCycle(mockGameId, 1, CycleCloseReason.DEADLINE)

    expect(companyRepository.findByGameId).not.toHaveBeenCalled()
  })

  it('processes the cycle, repeats missing decisions and opens the next one', async () => {
    gameRepository.updateCycleStatus.mockResolvedValue(mockGame())
    companyRepository.findByGameId.mockResolvedValue([mockCompany('65f0000000000000000000a1'), mockCompany('65f0000000000000000000a2')])
    decisionRepository.findByGameIdAndCycle.mockResolvedValue([])
    cycleResultRepository.findByGameIdAndCycle.mockResolvedValue([])

    await service.closeCycle(mockGameId, 1, CycleCloseReason.DEADLINE)

    expect(decisionRepository.upsert).toHaveBeenCalledTimes(2)
    expect(cycleResultRepository.createMany).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ autoDecisions: true })]))
    expect(gameRepository.updateById).toHaveBeenCalledWith(mockGameId, expect.objectContaining({ currentCycle: 2, cycleStatus: CycleStatus.OPEN }))
    expect(cycleProducer.scheduleDeadline).toHaveBeenCalledWith(mockGameId, 2, expect.any(Date))
  })

  it('finishes the game on the last cycle', async () => {
    gameRepository.updateCycleStatus.mockResolvedValue(mockGame({ currentCycle: 2 }))
    companyRepository.findByGameId.mockResolvedValue([mockCompany('65f0000000000000000000a1')])
    decisionRepository.findByGameIdAndCycle.mockResolvedValue([])
    cycleResultRepository.findByGameIdAndCycle.mockResolvedValue([])

    await service.closeCycle(mockGameId, 2, CycleCloseReason.FORCED)

    expect(gameRepository.updateById).toHaveBeenCalledWith(mockGameId, expect.objectContaining({ status: GameStatus.FINISHED }))
    expect(cycleProducer.scheduleDeadline).not.toHaveBeenCalled()
  })

  it('releases the cycle when processing fails', async () => {
    gameRepository.updateCycleStatus.mockResolvedValueOnce(mockGame()).mockResolvedValueOnce(null)
    companyRepository.findByGameId.mockRejectedValue(new Error('db down'))

    await expect(service.closeCycle(mockGameId, 1, CycleCloseReason.DEADLINE)).rejects.toThrow('db down')
    expect(gameRepository.updateCycleStatus).toHaveBeenLastCalledWith(mockGameId, 1, CycleStatus.PROCESSING, CycleStatus.OPEN)
  })

  it('lets bots decide on their own and never marks them as auto', async () => {
    const bot = mockCompany('65f0000000000000000000b1', { isBot: true, botProfile: { strategy: BotStrategy.PREMIUM, level: BotLevel.HARD } })
    gameRepository.updateCycleStatus.mockResolvedValue(mockGame())
    companyRepository.findByGameId.mockResolvedValue([mockCompany('65f0000000000000000000a1'), bot])
    decisionRepository.findByGameIdAndCycle.mockResolvedValue([])
    cycleResultRepository.findByGameIdAndCycle.mockResolvedValue([])

    await service.closeCycle(mockGameId, 1, CycleCloseReason.DEADLINE)

    expect(decisionRepository.upsert).toHaveBeenCalledWith(expect.objectContaining({ companyId: bot.id, submitted: true, auto: false }))
    const results = cycleResultRepository.createMany.mock.calls[0][0] as { companyId: string; autoDecisions: boolean; appliedDecisions: { marketing: { price: { B: number } } } }[]
    const botResult = results.find((r) => r.companyId === bot.id)!
    expect(botResult.autoDecisions).toBe(false)
    expect(botResult.appliedDecisions.marketing.price.B).toBeGreaterThan(40)
  })

  it('only waits for humans before closing early', async () => {
    const bot = mockCompany('65f0000000000000000000b1', { isBot: true, botProfile: { strategy: BotStrategy.BALANCED, level: BotLevel.NORMAL } })
    companyRepository.findByGameId.mockResolvedValue([mockCompany('65f0000000000000000000a1'), bot])
    decisionRepository.findByGameIdAndCycle.mockResolvedValue([{ companyId: '65f0000000000000000000a1', submitted: true, auto: false }])

    await service.registerSubmission(mockGameId, 1)

    expect(liveGateway.notifyDecisionSubmitted).toHaveBeenCalledWith(expect.objectContaining({ submitted: 1, total: 1 }))
    expect(cycleProducer.closeNow).toHaveBeenCalled()
  })

  it('closes early when every active company submitted', async () => {
    companyRepository.findByGameId.mockResolvedValue([mockCompany('65f0000000000000000000a1')])
    decisionRepository.findByGameIdAndCycle.mockResolvedValue([{ companyId: '65f0000000000000000000a1', submitted: true, auto: false }])

    await service.registerSubmission(mockGameId, 1)

    expect(cycleProducer.closeNow).toHaveBeenCalledWith(mockGameId, 1, CycleCloseReason.ALL_SUBMITTED)
  })
})
