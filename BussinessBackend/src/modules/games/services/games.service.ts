import { Injectable, Logger } from '@nestjs/common'

import { CompanyDbRepository } from '@/db/company/company-db.repository'
import { CycleResultDbRepository } from '@/db/cycle-result/cycle-result-db.repository'
import { DecisionDbRepository } from '@/db/decision/decision-db.repository'
import { GameDbRepository } from '@/db/game/game-db.repository'
import { MarketResultDbRepository } from '@/db/market-result/market-result-db.repository'
import { LiveGateway } from '@/modules/live/gateway/live.gateway'
import { SimulationService } from '@/modules/simulation/services/simulation.service'
import { CycleProducer } from '@/queues/producers/cycle.producer'

import { generatePin, generatePlayerToken, generateSeed, hashToken } from '@/commons/helpers/token.helper'
import { withCompanyNames } from '@/commons/helpers/ranking.helper'
import { deepMerge } from '../helpers/settings.helper'

import { CycleCloseReason, CycleStatus, GameStatus, MAX_COMPANIES_PER_GAME } from '@/commons/constants/game.constant'
import { FacilitatorSessionDto } from '@/commons/dto/authenticate.dto'
import { GameDbDto } from '@/db/game/game-db.dto'
import { DEFAULT_GAME_SETTINGS } from '@/modules/simulation/engine/engine.constant'
import { createInitialCompanyState } from '@/modules/simulation/engine/company.engine'
import { BotStrategy, GameSettings, ValuationMethod } from '@/modules/simulation/engine/engine.types'
import { BOT_AVATARS, BOT_COLORS, BOT_NAMES, GAME_PRESETS, PIN_GENERATION_ATTEMPTS } from '../games.constant'
import { AddBotsRequestDto } from '../dto/request/add-bots-request.dto'
import { CreateGameRequestDto } from '../dto/request/create-game-request.dto'
import {
  CycleDetailResponseDto,
  DefaultSettingsResponseDto,
  GameDetailResponseDto,
  GameSummaryResponseDto,
} from '../dto/response/game-response.dto'
import { GameSettingsSchema } from '../validations/game-settings.validation'

import { CompanyNotFoundException } from '@/commons/exceptions/company/company-not-found.exception'
import { CycleNotFoundException } from '@/commons/exceptions/game/cycle-not-found.exception'
import { CycleNotOpenException } from '@/commons/exceptions/game/cycle-not-open.exception'
import { GameFullException } from '@/commons/exceptions/game/game-full.exception'
import { GameNotFoundException } from '@/commons/exceptions/game/game-not-found.exception'
import { GameNotInLobbyException } from '@/commons/exceptions/game/game-not-in-lobby.exception'
import { GameNotInProgressException } from '@/commons/exceptions/game/game-not-in-progress.exception'
import { GamePinUnavailableException } from '@/commons/exceptions/game/game-pin-unavailable.exception'
import { GameWithoutCompaniesException } from '@/commons/exceptions/game/game-without-companies.exception'
import { InvalidGameSettingsException } from '@/commons/exceptions/game/invalid-game-settings.exception'

const BOT_TOKEN_TTL_MS = 365 * 24 * 3_600_000

@Injectable()
export class GamesService {
  private readonly logger = new Logger(GamesService.name)

  constructor(
    private readonly gameRepository: GameDbRepository,
    private readonly companyRepository: CompanyDbRepository,
    private readonly decisionRepository: DecisionDbRepository,
    private readonly cycleResultRepository: CycleResultDbRepository,
    private readonly marketResultRepository: MarketResultDbRepository,
    private readonly simulationService: SimulationService,
    private readonly cycleProducer: CycleProducer,
    private readonly liveGateway: LiveGateway,
  ) {}

  getDefaults(): DefaultSettingsResponseDto {
    return { settings: DEFAULT_GAME_SETTINGS, presets: GAME_PRESETS }
  }

  async create(user: FacilitatorSessionDto, body: CreateGameRequestDto): Promise<GameDetailResponseDto> {
    const settings = this.buildSettings(body)
    const pin = await this.uniquePin()
    const game = await this.gameRepository.create({
      facilitatorId: user.id,
      name: body.name,
      pin,
      settings,
      cycleDurationMinutes: body.cycleDurationMinutes,
    })
    this.logger.log(`[create] game ${game.id} by ${user.id}`)
    return this.getDetail(user, game.id)
  }

  async list(user: FacilitatorSessionDto): Promise<GameSummaryResponseDto[]> {
    const games = await this.gameRepository.findByFacilitatorId(user.id)
    return Promise.all(games.map(async (game) => this.toSummary(game, await this.companyRepository.countByGameId(game.id))))
  }

  async getDetail(user: FacilitatorSessionDto, gameId: string): Promise<GameDetailResponseDto> {
    const game = await this.findOwned(user, gameId)
    const companies = await this.companyRepository.findByGameId(game.id)
    const decisions = game.currentCycle > 0 ? await this.decisionRepository.findByGameIdAndCycle(game.id, game.currentCycle) : []
    const markets = await this.marketResultRepository.findByGameId(game.id)
    const lastClosed = markets.length ? markets[markets.length - 1].cycle : 0
    return {
      ...this.toSummary(game, companies.length),
      serverTime: new Date().toISOString(),
      settings: game.settings,
      companiesDetail: companies.map((company) => ({
        id: company.id,
        name: company.name,
        avatar: company.avatar,
        color: company.color,
        status: company.status,
        valuationMethod: company.valuationMethod,
        isBot: company.isBot,
        botProfile: company.botProfile,
        submitted: company.isBot || decisions.some((d) => d.companyId === company.id && d.submitted && !d.auto),
        cash: Math.round(company.state.cash * 100) / 100,
        sharePrice: Math.round(company.state.sharePrice * 100) / 100,
      })),
      ranking: withCompanyNames(game.ranking, companies),
      marketHistory: markets.map(({ result }) => ({
        cycle: result.cycle,
        marketSize: Math.round(result.marketSize),
        economyIndex: Math.round(result.economyIndex * 100) / 100,
        totalSales: result.totalSales,
        averagePrice: result.averagePrice,
        unservedDemand: Math.round(result.unservedDemand),
      })),
      economyHistory: game.economy ? game.economy.index.slice(0, lastClosed + 1).map((v) => Math.round(v * 100) / 100) : [100],
    }
  }

  async start(user: FacilitatorSessionDto, gameId: string): Promise<GameDetailResponseDto> {
    const game = await this.findOwned(user, gameId)
    if (game.status !== GameStatus.LOBBY) throw new GameNotInLobbyException()
    const companies = await this.companyRepository.findByGameId(game.id)
    if (!companies.length) throw new GameWithoutCompaniesException()
    await this.simulationService.startGame(game, companies)
    return this.getDetail(user, game.id)
  }

  async forceClose(user: FacilitatorSessionDto, gameId: string): Promise<{ queued: boolean }> {
    const game = await this.findOwned(user, gameId)
    if (game.status !== GameStatus.IN_PROGRESS) throw new GameNotInProgressException()
    if (game.cycleStatus !== CycleStatus.OPEN) throw new CycleNotOpenException()
    await this.cycleProducer.closeNow(game.id, game.currentCycle, CycleCloseReason.FORCED)
    return { queued: true }
  }

  async getCycle(user: FacilitatorSessionDto, gameId: string, cycle: number): Promise<CycleDetailResponseDto> {
    const game = await this.findOwned(user, gameId)
    const market = await this.marketResultRepository.findByGameIdAndCycle(game.id, cycle)
    if (!market) throw new CycleNotFoundException({ cycle })
    const companies = await this.companyRepository.findByGameId(game.id)
    const results = await this.cycleResultRepository.findByGameIdAndCycle(game.id, cycle)
    return {
      cycle,
      market: market.result,
      ranking: withCompanyNames(market.ranking, companies),
      companies: results.flatMap((result) => {
        const company = companies.find((c) => c.id === result.companyId)
        return company
          ? [{ id: company.id, name: company.name, avatar: company.avatar, color: company.color, isBot: company.isBot, autoDecisions: result.autoDecisions, report: result.report }]
          : []
      }),
    }
  }

  async removeCompany(user: FacilitatorSessionDto, gameId: string, companyId: string): Promise<{ removed: boolean }> {
    const game = await this.findOwned(user, gameId)
    if (game.status !== GameStatus.LOBBY) throw new GameNotInLobbyException()
    const company = await this.companyRepository.findById(companyId)
    if (company?.gameId !== game.id) throw new CompanyNotFoundException()
    await this.companyRepository.deleteById(companyId)
    await this.notifyLobby(game.id)
    return { removed: true }
  }

  // Bots are regular companies whose decisions the engine takes at cycle close; their token is never handed out
  async addBots(user: FacilitatorSessionDto, gameId: string, body: AddBotsRequestDto): Promise<GameDetailResponseDto> {
    const game = await this.findOwned(user, gameId)
    if (game.status !== GameStatus.LOBBY) throw new GameNotInLobbyException()
    const existing = await this.companyRepository.findByGameId(game.id)
    if (existing.length + body.count > MAX_COMPANIES_PER_GAME) throw new GameFullException({ max: MAX_COMPANIES_PER_GAME })
    const usedNames = new Set(existing.map((company) => company.name.toLowerCase()))
    const strategies = Object.values(BotStrategy)
    const botsSoFar = existing.filter((company) => company.isBot).length
    for (let i = 0; i < body.count; i++) {
      const index = botsSoFar + i
      const name = this.botName(usedNames, index)
      usedNames.add(name.toLowerCase())
      await this.companyRepository.create({
        gameId: game.id,
        name,
        avatar: BOT_AVATARS[index % BOT_AVATARS.length],
        color: BOT_COLORS[index % BOT_COLORS.length],
        playerTokenHash: hashToken(generatePlayerToken()),
        tokenExpiresAt: new Date(Date.now() + BOT_TOKEN_TTL_MS),
        valuationMethod: ValuationMethod.WEIGHTED_AVERAGE,
        state: createInitialCompanyState(game.settings, ValuationMethod.WEIGHTED_AVERAGE),
        botProfile: { strategy: body.strategy ?? strategies[index % strategies.length], level: body.level },
      })
    }
    this.logger.log(`[addBots] ${body.count} bots added to game ${game.id}`)
    await this.notifyLobby(game.id)
    return this.getDetail(user, game.id)
  }

  private botName(used: Set<string>, index: number): string {
    for (let offset = 0; offset < BOT_NAMES.length; offset++) {
      const candidate = BOT_NAMES[(index + offset) % BOT_NAMES.length]
      if (!used.has(candidate.toLowerCase())) return candidate
    }
    return `Bot ${index + 1}`
  }

  private async notifyLobby(gameId: string): Promise<void> {
    const companies = await this.companyRepository.findByGameId(gameId)
    this.liveGateway.notifyLobbyUpdated({
      gameId,
      companies: companies.map((c) => ({ id: c.id, name: c.name, avatar: c.avatar, color: c.color, isBot: c.isBot })),
    })
  }

  private buildSettings(body: CreateGameRequestDto): GameSettings {
    const merged = deepMerge<GameSettings>(structuredClone(DEFAULT_GAME_SETTINGS), body.settings ?? {})
    merged.cycles = body.cycles
    merged.seed = generateSeed()
    const parsed = GameSettingsSchema.safeParse(merged)
    if (!parsed.success) {
      throw new InvalidGameSettingsException({
        issues: parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      })
    }
    return parsed.data as GameSettings
  }

  private async uniquePin(): Promise<string> {
    for (let attempt = 0; attempt < PIN_GENERATION_ATTEMPTS; attempt++) {
      const pin = generatePin()
      if (!(await this.gameRepository.existsByPin(pin))) return pin
    }
    throw new GamePinUnavailableException()
  }

  private async findOwned(user: FacilitatorSessionDto, gameId: string): Promise<GameDbDto> {
    const game = await this.gameRepository.findById(gameId)
    if (game?.facilitatorId !== user.id) throw new GameNotFoundException()
    return game
  }

  private toSummary(game: GameDbDto, companies: number): GameSummaryResponseDto {
    return {
      id: game.id,
      name: game.name,
      pin: game.pin,
      status: game.status,
      currentCycle: game.currentCycle,
      totalCycles: game.settings.cycles,
      cycleStatus: game.cycleStatus,
      cycleDeadline: game.cycleDeadline ? game.cycleDeadline.toISOString() : null,
      cycleDurationMinutes: game.cycleDurationMinutes,
      companies,
      createdAt: game.createdAt.toISOString(),
    }
  }
}
