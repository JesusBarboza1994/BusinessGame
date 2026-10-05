import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common'

import { AuthenticatedGuard } from '@/commons/guards/authenticated.guard'

import { GamesService } from '../services/games.service'

import { Authenticated } from '@/commons/decorators/authenticated.decorator'
import { ResponseMessage } from '@/commons/decorators/response-message.decorator'

import { AuthenticatedSessionDto } from '@/commons/dto/authenticate.dto'
import { AddBotsRequestDto } from '../dto/request/add-bots-request.dto'
import { CreateGameRequestDto } from '../dto/request/create-game-request.dto'
import {
  CycleDetailResponseDto,
  DefaultSettingsResponseDto,
  GameDetailResponseDto,
  GameSummaryResponseDto,
} from '../dto/response/game-response.dto'

@Controller({ path: 'games', version: '1' })
@UseGuards(AuthenticatedGuard)
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get('settings/default')
  @ResponseMessage('GAME_DEFAULTS_SUCCESS', 'Default settings retrieved successfully')
  defaults(): DefaultSettingsResponseDto {
    return this.gamesService.getDefaults()
  }

  @Post()
  @ResponseMessage('GAME_CREATE_SUCCESS', 'Game created successfully')
  async create(@Body() body: CreateGameRequestDto, @Authenticated() { user }: AuthenticatedSessionDto): Promise<GameDetailResponseDto> {
    return this.gamesService.create(user, body)
  }

  @Get()
  @ResponseMessage('GAME_LIST_SUCCESS', 'Games retrieved successfully')
  async list(@Authenticated() { user }: AuthenticatedSessionDto): Promise<GameSummaryResponseDto[]> {
    return this.gamesService.list(user)
  }

  @Get(':gameId')
  @ResponseMessage('GAME_DETAIL_SUCCESS', 'Game retrieved successfully')
  async detail(@Param('gameId') gameId: string, @Authenticated() { user }: AuthenticatedSessionDto): Promise<GameDetailResponseDto> {
    return this.gamesService.getDetail(user, gameId)
  }

  @Post(':gameId/start')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('GAME_START_SUCCESS', 'Game started successfully')
  async start(@Param('gameId') gameId: string, @Authenticated() { user }: AuthenticatedSessionDto): Promise<GameDetailResponseDto> {
    return this.gamesService.start(user, gameId)
  }

  @Post(':gameId/close-cycle')
  @HttpCode(HttpStatus.ACCEPTED)
  @ResponseMessage('GAME_CLOSE_CYCLE_SUCCESS', 'Cycle close queued')
  async closeCycle(@Param('gameId') gameId: string, @Authenticated() { user }: AuthenticatedSessionDto): Promise<{ queued: boolean }> {
    return this.gamesService.forceClose(user, gameId)
  }

  @Get(':gameId/cycles/:cycle')
  @ResponseMessage('GAME_CYCLE_SUCCESS', 'Cycle results retrieved successfully')
  async cycle(
    @Param('gameId') gameId: string,
    @Param('cycle', ParseIntPipe) cycle: number,
    @Authenticated() { user }: AuthenticatedSessionDto,
  ): Promise<CycleDetailResponseDto> {
    return this.gamesService.getCycle(user, gameId, cycle)
  }

  @Post(':gameId/bots')
  @ResponseMessage('GAME_ADD_BOTS_SUCCESS', 'Bots added successfully')
  async addBots(
    @Param('gameId') gameId: string,
    @Body() body: AddBotsRequestDto,
    @Authenticated() { user }: AuthenticatedSessionDto,
  ): Promise<GameDetailResponseDto> {
    return this.gamesService.addBots(user, gameId, body)
  }

  @Delete(':gameId/companies/:companyId')
  @ResponseMessage('GAME_REMOVE_COMPANY_SUCCESS', 'Company removed successfully')
  async removeCompany(
    @Param('gameId') gameId: string,
    @Param('companyId') companyId: string,
    @Authenticated() { user }: AuthenticatedSessionDto,
  ): Promise<{ removed: boolean }> {
    return this.gamesService.removeCompany(user, gameId, companyId)
  }
}
