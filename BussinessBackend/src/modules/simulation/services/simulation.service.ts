import { Injectable, Logger } from '@nestjs/common'

import { CompanyDbRepository } from '@/db/company/company-db.repository'
import { CycleResultDbRepository } from '@/db/cycle-result/cycle-result-db.repository'
import { DecisionDbRepository } from '@/db/decision/decision-db.repository'
import { GameDbRepository } from '@/db/game/game-db.repository'
import { MarketResultDbRepository } from '@/db/market-result/market-result-db.repository'
import { LiveGateway } from '@/modules/live/gateway/live.gateway'
import { CycleProducer } from '@/queues/producers/cycle.producer'

import { CycleCloseReason, CycleStatus, GameStatus } from '@/commons/constants/game.constant'
import { CompanyDbDto } from '@/db/company/company-db.dto'
import { GameDbDto } from '@/db/game/game-db.dto'
import { buildMarketResearch } from '../engine/market-research.engine'
import { buildRanking, createInitialMarketState, runCycle } from '../engine/cycle.engine'
import { defaultDecisions, repeatDecisions } from '../engine/decisions.engine'
import { decideForBot } from '../engine/bot.engine'
import { generateEconomy } from '../engine/economy.engine'
import { CompanyDecisions, CompanyStatus, CycleCompanyInput } from '../engine/engine.types'

@Injectable()
export class SimulationService {
  private readonly logger = new Logger(SimulationService.name)

  constructor(
    private readonly gameRepository: GameDbRepository,
    private readonly companyRepository: CompanyDbRepository,
    private readonly decisionRepository: DecisionDbRepository,
    private readonly cycleResultRepository: CycleResultDbRepository,
    private readonly marketResultRepository: MarketResultDbRepository,
    private readonly cycleProducer: CycleProducer,
    private readonly liveGateway: LiveGateway,
  ) {}

  async startGame(game: GameDbDto, companies: CompanyDbDto[]): Promise<GameDbDto> {
    const economy = generateEconomy(game.settings)
    const deadline = this.deadlineFrom(game)
    const ranking = buildRanking(game.settings, companies.map((company) => ({ id: company.id, state: company.state })))
    const updated = await this.gameRepository.updateById(game.id, {
      status: GameStatus.IN_PROGRESS,
      currentCycle: 1,
      cycleStatus: CycleStatus.OPEN,
      cycleDeadline: deadline,
      economy,
      marketState: createInitialMarketState(companies.length),
      ranking,
      startedAt: new Date(),
    })
    await this.cycleProducer.scheduleDeadline(game.id, 1, deadline)
    this.liveGateway.notifyGameStarted({ gameId: game.id, cycle: 1, deadline: deadline.toISOString() })
    this.logger.log(`[startGame] game ${game.id} started with ${companies.length} companies`)
    return updated as GameDbDto
  }

  // Counts human submissions (bots are always ready) and closes the cycle early when every active human is done
  async registerSubmission(gameId: string, cycle: number): Promise<void> {
    const companies = await this.companyRepository.findByGameId(gameId)
    const active = companies.filter((company) => company.status === CompanyStatus.ACTIVE && !company.isBot)
    const decisions = await this.decisionRepository.findByGameIdAndCycle(gameId, cycle)
    const submittedIds = decisions.filter((d) => d.submitted && !d.auto).map((d) => d.companyId)
    const submitted = active.filter((company) => submittedIds.includes(company.id)).length
    this.liveGateway.notifyDecisionSubmitted({ gameId, cycle, submitted, total: active.length, submittedCompanyIds: submittedIds })
    if (active.length > 0 && submitted >= active.length) {
      await this.cycleProducer.closeNow(gameId, cycle, CycleCloseReason.ALL_SUBMITTED)
    }
  }

  async closeCycle(gameId: string, cycle: number, reason: CycleCloseReason): Promise<void> {
    const game = await this.gameRepository.updateCycleStatus(gameId, cycle, CycleStatus.OPEN, CycleStatus.PROCESSING)
    if (!game) {
      this.logger.warn(`[closeCycle] game ${gameId} cycle ${cycle} is not open, skipping (${reason})`)
      return
    }
    this.liveGateway.notifyCycleProcessing({ gameId, cycle, reason })
    try {
      await this.processCycle(game, cycle)
    } catch (error) {
      this.logger.error(`[closeCycle] game ${gameId} cycle ${cycle}: ${(error as Error).message}`)
      await this.releaseCycle(gameId, cycle)
      throw error
    }
  }

  async releaseCycle(gameId: string, cycle: number): Promise<void> {
    await this.gameRepository.updateCycleStatus(gameId, cycle, CycleStatus.PROCESSING, CycleStatus.OPEN)
  }

  private async processCycle(game: GameDbDto, cycle: number): Promise<void> {
    if (!game.economy || !game.marketState) throw new Error(`game ${game.id} has no economy or market state`)
    const companies = await this.companyRepository.findByGameId(game.id)
    const decisions = await this.decisionRepository.findByGameIdAndCycle(game.id, cycle)
    const previousResults = await this.cycleResultRepository.findByGameIdAndCycle(game.id, cycle - 1)
    const existingResults = await this.cycleResultRepository.findByGameIdAndCycle(game.id, cycle)
    const marketState = game.marketState.cycle >= cycle ? (await this.previousMarketState(game, cycle)) : game.marketState
    const previousMarket = cycle > 1 ? await this.marketResultRepository.findByGameIdAndCycle(game.id, cycle - 1) : null
    const activeCount = companies.filter((company) => company.status === CompanyStatus.ACTIVE).length

    const autoIds = new Set<string>()
    const inputs: CycleCompanyInput[] = []
    for (const company of companies) {
      // A retried job may find states already advanced; restore the snapshot taken before this cycle
      const stateBefore = company.state.cycle >= cycle ? existingResults.find((r) => r.companyId === company.id)?.stateBefore : company.state
      if (!stateBefore) throw new Error(`missing state snapshot for company ${company.id} cycle ${cycle}`)
      const submitted = decisions.find((d) => d.companyId === company.id && d.submitted && !d.auto)
      let companyDecisions: CompanyDecisions
      if (company.isBot && company.botProfile && stateBefore.status === CompanyStatus.ACTIVE) {
        companyDecisions = decideForBot(game.settings, stateBefore, company.botProfile, {
          cycle,
          market: marketState,
          economy: game.economy,
          companies: activeCount,
          seed: game.settings.seed,
          companyId: company.id,
          averagePrice: previousMarket?.result.averagePrice ?? null,
        })
        await this.decisionRepository.upsert({ gameId: game.id, companyId: company.id, cycle, decisions: companyDecisions, submitted: true, auto: false })
      } else if (submitted) {
        companyDecisions = submitted.decisions
      } else {
        const previous = previousResults.find((r) => r.companyId === company.id)
        companyDecisions = previous ? repeatDecisions(previous.appliedDecisions) : defaultDecisions(game.settings, stateBefore)
        autoIds.add(company.id)
        if (stateBefore.status === CompanyStatus.ACTIVE) {
          await this.decisionRepository.upsert({ gameId: game.id, companyId: company.id, cycle, decisions: companyDecisions, submitted: false, auto: true })
        }
      }
      inputs.push({ id: company.id, state: stateBefore, decisions: companyDecisions })
    }

    const output = runCycle({ settings: game.settings, cycle, market: marketState, economy: game.economy, companies: inputs })
    const nextForecast = game.economy.forecastNextQuarter[Math.min(cycle, game.economy.forecastNextQuarter.length - 1)]
    const research = buildMarketResearch(game.settings, output.marketResult, nextForecast)

    await this.cycleResultRepository.createMany(
      output.companies
        .filter((company) => company.report && company.appliedDecisions)
        .map((company) => ({
          gameId: game.id,
          companyId: company.id,
          cycle,
          report: company.report!,
          appliedDecisions: company.appliedDecisions!,
          autoDecisions: autoIds.has(company.id),
          stateBefore: inputs.find((input) => input.id === company.id)!.state,
          marketResearch: company.appliedDecisions!.marketing.buyMarketResearch ? research : null,
        })),
    )
    await this.marketResultRepository.create({ gameId: game.id, cycle, result: output.marketResult, ranking: output.ranking })
    for (const company of output.companies) {
      if (company.report) await this.companyRepository.updateState(company.id, company.state, company.state.status)
    }

    const activeLeft = output.companies.filter((company) => company.state.status === CompanyStatus.ACTIVE).length
    const finished = cycle >= game.settings.cycles || activeLeft === 0
    if (finished) {
      await this.gameRepository.updateById(game.id, {
        status: GameStatus.FINISHED,
        cycleStatus: CycleStatus.CLOSED,
        cycleDeadline: null,
        marketState: output.market,
        ranking: output.ranking,
        finishedAt: new Date(),
      })
      this.liveGateway.notifyCycleClosed({ gameId: game.id, closedCycle: cycle, nextCycle: null, deadline: null, finished: true })
      this.logger.log(`[processCycle] game ${game.id} finished at cycle ${cycle}`)
      return
    }

    const deadline = this.deadlineFrom(game)
    await this.gameRepository.updateById(game.id, {
      currentCycle: cycle + 1,
      cycleStatus: CycleStatus.OPEN,
      cycleDeadline: deadline,
      marketState: output.market,
      ranking: output.ranking,
    })
    await this.cycleProducer.scheduleDeadline(game.id, cycle + 1, deadline)
    this.liveGateway.notifyCycleClosed({ gameId: game.id, closedCycle: cycle, nextCycle: cycle + 1, deadline: deadline.toISOString(), finished: false })
    this.logger.log(`[processCycle] game ${game.id} closed cycle ${cycle}`)
  }

  // Rebuilds the market state of the previous cycle when a retry finds the game state already advanced
  private async previousMarketState(game: GameDbDto, cycle: number) {
    if (cycle <= 1) return createInitialMarketState(game.marketState!.initialCompanies)
    const previous = await this.marketResultRepository.findByGameIdAndCycle(game.id, cycle - 1)
    if (!previous) throw new Error(`missing market result for cycle ${cycle - 1}`)
    return {
      cycle: cycle - 1,
      growthIndex: previous.result.growthIndex,
      latentDemand: previous.result.latentDemandOut,
      initialCompanies: game.marketState!.initialCompanies,
    }
  }

  private deadlineFrom(game: GameDbDto): Date {
    return new Date(Date.now() + game.cycleDurationMinutes * 60_000)
  }
}
