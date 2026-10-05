import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { CompanyDbRepository } from '@/db/company/company-db.repository'
import { CycleResultDbRepository } from '@/db/cycle-result/cycle-result-db.repository'
import { DecisionDbRepository } from '@/db/decision/decision-db.repository'
import { GameDbRepository } from '@/db/game/game-db.repository'
import { MarketResultDbRepository } from '@/db/market-result/market-result-db.repository'
import { LiveGateway } from '@/modules/live/gateway/live.gateway'
import { SimulationService } from '@/modules/simulation/services/simulation.service'

import { withCompanyNames } from '@/commons/helpers/ranking.helper'
import { generatePlayerToken, hashToken } from '@/commons/helpers/token.helper'

import { CycleStatus, GameStatus, MAX_COMPANIES_PER_GAME } from '@/commons/constants/game.constant'
import { PlayerSessionDto } from '@/commons/dto/authenticate.dto'
import { CompanyDbDto } from '@/db/company/company-db.dto'
import { GameDbDto } from '@/db/game/game-db.dto'
import { MarketResultDbDto } from '@/db/market-result/market-result-db.dto'
import { createInitialCompanyState, longTermBalance, totalEquity } from '@/modules/simulation/engine/company.engine'
import { defaultDecisions, repeatDecisions } from '@/modules/simulation/engine/decisions.engine'
import { layersUnits } from '@/modules/simulation/engine/inventory.engine'
import { quarterlyRateFromAnnual } from '@/modules/simulation/engine/loan.engine'
import { computeMarketingIndex, computeQualityIndex } from '@/modules/simulation/engine/market.engine'
import { roundDeep } from '@/modules/simulation/engine/math.util'
import { validateDecisions, DecisionValidation } from '@/modules/simulation/engine/validation.engine'
import { CompanyDecisions, CompanyStatus } from '@/modules/simulation/engine/engine.types'
import { AuthConfig } from '@/settings/settings.model'
import { JoinGameRequestDto } from '../dto/request/join-game-request.dto'
import {
  CompanySnapshotDto,
  DecisionSource,
  HistoryEntryDto,
  IndustryInfoDto,
  JoinGameResponseDto,
  LobbyInfoResponseDto,
  PlayerCycleReportResponseDto,
  PlayerDashboardResponseDto,
} from '../dto/response/play-response.dto'

import { CompanyBankruptException } from '@/commons/exceptions/company/company-bankrupt.exception'
import { CompanyNameTakenException } from '@/commons/exceptions/company/company-name-taken.exception'
import { CompanyNotFoundException } from '@/commons/exceptions/company/company-not-found.exception'
import { DecisionInvalidException } from '@/commons/exceptions/decision/decision-invalid.exception'
import { CycleNotFoundException } from '@/commons/exceptions/game/cycle-not-found.exception'
import { CycleNotOpenException } from '@/commons/exceptions/game/cycle-not-open.exception'
import { GameFullException } from '@/commons/exceptions/game/game-full.exception'
import { GameNotFoundException } from '@/commons/exceptions/game/game-not-found.exception'
import { GameNotInLobbyException } from '@/commons/exceptions/game/game-not-in-lobby.exception'

interface PlayContext {
  game: GameDbDto
  company: CompanyDbDto
}

@Injectable()
export class PlayService {
  private readonly logger = new Logger(PlayService.name)
  private readonly tokenTtlHours: number

  constructor(
    private readonly gameRepository: GameDbRepository,
    private readonly companyRepository: CompanyDbRepository,
    private readonly decisionRepository: DecisionDbRepository,
    private readonly cycleResultRepository: CycleResultDbRepository,
    private readonly marketResultRepository: MarketResultDbRepository,
    private readonly simulationService: SimulationService,
    private readonly liveGateway: LiveGateway,
    configService: ConfigService<{ auth: AuthConfig }, true>,
  ) {
    this.tokenTtlHours = configService.get<AuthConfig>('auth').playerTokenTtlHours
  }

  async lobby(pin: string): Promise<LobbyInfoResponseDto> {
    const game = await this.gameRepository.findByPin(pin)
    if (!game) throw new GameNotFoundException()
    const companies = await this.companyRepository.findByGameId(game.id)
    return {
      id: game.id,
      name: game.name,
      status: game.status,
      totalCycles: game.settings.cycles,
      cycleDurationMinutes: game.cycleDurationMinutes,
      companies: companies.map((c) => ({ id: c.id, name: c.name, avatar: c.avatar, color: c.color, isBot: c.isBot })),
    }
  }

  async join(body: JoinGameRequestDto): Promise<JoinGameResponseDto> {
    const game = await this.gameRepository.findByPin(body.pin)
    if (!game) throw new GameNotFoundException()
    if (game.status !== GameStatus.LOBBY) throw new GameNotInLobbyException()
    if ((await this.companyRepository.countByGameId(game.id)) >= MAX_COMPANIES_PER_GAME) throw new GameFullException()
    if (await this.companyRepository.existsByGameIdAndName(game.id, body.companyName)) throw new CompanyNameTakenException()

    const playerToken = generatePlayerToken()
    const company = await this.companyRepository.create({
      gameId: game.id,
      name: body.companyName,
      avatar: body.avatar,
      color: body.color,
      playerTokenHash: hashToken(playerToken),
      tokenExpiresAt: new Date(Date.now() + this.tokenTtlHours * 3_600_000),
      valuationMethod: body.valuationMethod,
      state: createInitialCompanyState(game.settings, body.valuationMethod),
    })
    const companies = await this.companyRepository.findByGameId(game.id)
    this.liveGateway.notifyLobbyUpdated({
      gameId: game.id,
      companies: companies.map((c) => ({ id: c.id, name: c.name, avatar: c.avatar, color: c.color, isBot: c.isBot })),
    })
    this.logger.log(`[join] company ${company.id} joined game ${game.id}`)
    return { playerToken, companyId: company.id, gameId: game.id }
  }

  async dashboard(player: PlayerSessionDto): Promise<PlayerDashboardResponseDto> {
    const { game, company } = await this.context(player)
    const companies = await this.companyRepository.findByGameId(game.id)
    const results = await this.cycleResultRepository.findByCompanyId(company.id)
    const markets = await this.marketResultRepository.findByGameId(game.id)
    const active = companies.filter((c) => c.status === CompanyStatus.ACTIVE)
    const humans = active.filter((c) => !c.isBot)
    const inProgress = game.status === GameStatus.IN_PROGRESS
    const currentDecisions = inProgress ? await this.decisionRepository.findByGameIdAndCycle(game.id, game.currentCycle) : []

    const decision = inProgress && company.status === CompanyStatus.ACTIVE ? await this.currentDecision(game, company) : null
    const validation = decision ? this.validate(game, company, decision.decisions, active.length) : null
    const lastClosed = markets.length ? markets[markets.length - 1].cycle : 0
    const economy = game.economy
    const settings = game.settings

    return {
      serverTime: new Date().toISOString(),
      game: {
        id: game.id,
        name: game.name,
        status: game.status,
        currentCycle: game.currentCycle,
        totalCycles: settings.cycles,
        cycleStatus: game.cycleStatus,
        cycleDeadline: game.cycleDeadline ? game.cycleDeadline.toISOString() : null,
        cycleDurationMinutes: game.cycleDurationMinutes,
        submitted: currentDecisions.filter((d) => d.submitted && !d.auto && humans.some((c) => c.id === d.companyId)).length,
        activeCompanies: humans.length,
        bots: active.length - humans.length,
      },
      company: {
        id: company.id,
        name: company.name,
        avatar: company.avatar,
        color: company.color,
        status: company.status,
        valuationMethod: company.valuationMethod,
        bankruptCycle: company.state.bankruptCycle,
      },
      snapshot: this.snapshot(game, company),
      economy: {
        current: economy ? round(economy.index[lastClosed]) : 100,
        forecastNextQuarter: economy ? round(economy.forecastNextQuarter[lastClosed]) : null,
        forecastNextYear: economy ? round(economy.forecastNextYear[lastClosed]) : null,
        history: economy ? economy.index.slice(0, lastClosed + 1).map(round) : [100],
      },
      decision,
      validation,
      lastReport: results.length ? results[results.length - 1].report : null,
      history: this.history(company.id, results, markets),
      ranking: withCompanyNames(game.ranking, companies),
      industry: markets.map((market) => this.industry(market)),
      rules: {
        cycles: settings.cycles,
        production: settings.production,
        costs: settings.costs,
        finance: settings.finance,
        initial: settings.initial,
        rankingMetric: settings.rankingMetric,
        refPrice: settings.market.refPrice,
        longTermQuarterlyRate: quarterlyRateFromAnnual(settings.finance.longTermAnnualRate),
      },
    }
  }

  async saveDraft(player: PlayerSessionDto, decisions: CompanyDecisions): Promise<DecisionValidation> {
    const { game, company } = await this.openContext(player)
    const previous = await this.decisionRepository.findByCompanyIdAndCycle(company.id, game.currentCycle)
    await this.decisionRepository.upsert({ gameId: game.id, companyId: company.id, cycle: game.currentCycle, decisions, submitted: false, auto: false })
    if (previous?.submitted) await this.simulationService.registerSubmission(game.id, game.currentCycle)
    return this.validate(game, company, decisions, await this.activeCount(game.id))
  }

  async validateOnly(player: PlayerSessionDto, decisions: CompanyDecisions): Promise<DecisionValidation> {
    const { game, company } = await this.openContext(player)
    return this.validate(game, company, decisions, await this.activeCount(game.id))
  }

  async submit(player: PlayerSessionDto, decisions: CompanyDecisions): Promise<DecisionValidation> {
    const { game, company } = await this.openContext(player)
    const validation = this.validate(game, company, decisions, await this.activeCount(game.id))
    if (!validation.valid) throw new DecisionInvalidException({ errors: validation.errors })
    await this.decisionRepository.upsert({ gameId: game.id, companyId: company.id, cycle: game.currentCycle, decisions, submitted: true, auto: false })
    this.logger.log(`[submit] company ${company.id} cycle ${game.currentCycle}`)
    await this.simulationService.registerSubmission(game.id, game.currentCycle)
    return validation
  }

  async report(player: PlayerSessionDto, cycle: number): Promise<PlayerCycleReportResponseDto> {
    const { game, company } = await this.context(player)
    const result = await this.cycleResultRepository.findByCompanyIdAndCycle(company.id, cycle)
    const market = await this.marketResultRepository.findByGameIdAndCycle(game.id, cycle)
    if (!result || !market) throw new CycleNotFoundException({ cycle })
    const companies = await this.companyRepository.findByGameId(game.id)
    const names = Object.fromEntries(companies.map((c) => [c.id, { name: c.name, avatar: c.avatar, color: c.color, isBot: c.isBot }]))
    return {
      cycle,
      report: result.report,
      appliedDecisions: result.appliedDecisions,
      autoDecisions: result.autoDecisions,
      marketResearch: result.marketResearch ? { ...result.marketResearch, names } : null,
      industry: this.industry(market),
      ranking: withCompanyNames(market.ranking, companies),
    }
  }

  private async currentDecision(game: GameDbDto, company: CompanyDbDto): Promise<NonNullable<PlayerDashboardResponseDto['decision']>> {
    const cycle = game.currentCycle
    const stored = await this.decisionRepository.findByCompanyIdAndCycle(company.id, cycle)
    if (stored) {
      const source: DecisionSource = stored.auto ? 'AUTO' : stored.submitted ? 'SUBMITTED' : 'DRAFT'
      return { cycle, decisions: stored.decisions, submitted: stored.submitted && !stored.auto, source }
    }
    const previous = await this.cycleResultRepository.findByCompanyIdAndCycle(company.id, cycle - 1)
    if (previous) return { cycle, decisions: repeatDecisions(previous.appliedDecisions), submitted: false, source: 'REPEAT' }
    return { cycle, decisions: defaultDecisions(game.settings, company.state), submitted: false, source: 'DEFAULT' }
  }

  private validate(game: GameDbDto, company: CompanyDbDto, decisions: CompanyDecisions, companies: number): DecisionValidation {
    return validateDecisions(game.settings, company.state, decisions, {
      cycle: game.currentCycle,
      market: game.marketState!,
      economy: game.economy!,
      companies,
    })
  }

  private snapshot(game: GameDbDto, company: CompanyDbDto): CompanySnapshotDto {
    const s = company.state
    return roundDeep({
      cash: s.cash,
      capacity: s.capacity.active,
      capacityPending: s.capacity.pending,
      materials: s.materials,
      materialsInTransit: s.materialsInTransit,
      finishedGoods: { A: layersUnits(s.finishedGoods.A), B: layersUnits(s.finishedGoods.B) },
      equity: totalEquity(s),
      retainedEarnings: s.equity.retainedEarnings,
      sharePrice: s.sharePrice,
      shares: s.shares,
      securities: s.securities.principal + s.securities.accruedYield,
      debt: {
        shortTerm: s.debt.shortTerm.principal + s.debt.shortTerm.interest,
        longTerm: longTermBalance(s),
        emergency: s.debt.emergency.principal,
        longTermInstallment: s.debt.longTerm.reduce((acc, loan) => acc + loan.installment, 0),
      },
      qualityIndex: {
        A: computeQualityIndex(game.settings, 'A', s.qualityStock.A),
        B: computeQualityIndex(game.settings, 'B', s.qualityStock.B),
      },
      marketingIndex: {
        A: computeMarketingIndex(game.settings, s.marketingStock.A),
        B: computeMarketingIndex(game.settings, s.marketingStock.B),
      },
      emergencyStreak: s.emergencyStreak,
    })
  }

  private history(companyId: string, results: Awaited<ReturnType<CycleResultDbRepository['findByCompanyId']>>, markets: MarketResultDbDto[]): HistoryEntryDto[] {
    return results.map(({ cycle, report }) => {
      const market = markets.find((m) => m.cycle === cycle)
      return {
        cycle,
        revenue: report.incomeStatement.revenue.total,
        netIncome: report.incomeStatement.netIncome,
        cash: report.balanceSheet.assets.cash,
        equity: report.balanceSheet.equity.total,
        sharePrice: report.indicators.sharePrice,
        marketShare: report.operations.marketShare.total,
        sales: report.operations.sales,
        demand: report.operations.demand,
        price: report.operations.price,
        position: market?.ranking.find((r) => r.companyId === companyId)?.position ?? null,
      }
    })
  }

  private industry(market: MarketResultDbDto): IndustryInfoDto {
    return roundDeep({
      cycle: market.cycle,
      economyIndex: market.result.economyIndex,
      totalSales: market.result.totalSales,
      averagePrice: market.result.averagePrice,
      marketSize: Math.round(market.result.marketSize),
    })
  }

  private async activeCount(gameId: string): Promise<number> {
    const companies = await this.companyRepository.findByGameId(gameId)
    return companies.filter((c) => c.status === CompanyStatus.ACTIVE).length
  }

  private async context(player: PlayerSessionDto): Promise<PlayContext> {
    const [game, company] = await Promise.all([this.gameRepository.findById(player.gameId), this.companyRepository.findById(player.companyId)])
    if (!game) throw new GameNotFoundException()
    if (!company) throw new CompanyNotFoundException()
    return { game, company }
  }

  private async openContext(player: PlayerSessionDto): Promise<PlayContext> {
    const ctx = await this.context(player)
    if (ctx.game.status !== GameStatus.IN_PROGRESS || ctx.game.cycleStatus !== CycleStatus.OPEN) throw new CycleNotOpenException()
    if (ctx.company.status === CompanyStatus.BANKRUPT) throw new CompanyBankruptException()
    return ctx
  }
}

const round = (value: number | undefined): number => Math.round((value ?? 0) * 100) / 100
