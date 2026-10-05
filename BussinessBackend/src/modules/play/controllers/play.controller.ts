import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common'

import { PlayerGuard } from '@/commons/guards/player.guard'

import { PlayService } from '../services/play.service'

import { Player } from '@/commons/decorators/player.decorator'
import { ResponseMessage } from '@/commons/decorators/response-message.decorator'

import { PlayerSessionDto } from '@/commons/dto/authenticate.dto'
import { DecisionValidation } from '@/modules/simulation/engine/validation.engine'
import { JoinGameRequestDto } from '../dto/request/join-game-request.dto'
import { SubmitDecisionsRequestDto } from '../dto/request/submit-decisions-request.dto'
import {
  JoinGameResponseDto,
  LobbyInfoResponseDto,
  PlayerCycleReportResponseDto,
  PlayerDashboardResponseDto,
} from '../dto/response/play-response.dto'

@Controller({ path: 'play', version: '1' })
export class PlayController {
  constructor(private readonly playService: PlayService) {}

  // Kahoot-style entry: knowing the PIN is the only credential needed to see the lobby and join
  @Get('lobby/:pin')
  @ResponseMessage('PLAY_LOBBY_SUCCESS', 'Lobby retrieved successfully')
  async lobby(@Param('pin') pin: string): Promise<LobbyInfoResponseDto> {
    return this.playService.lobby(pin)
  }

  @Post('join')
  @ResponseMessage('PLAY_JOIN_SUCCESS', 'Joined game successfully')
  async join(@Body() body: JoinGameRequestDto): Promise<JoinGameResponseDto> {
    return this.playService.join(body)
  }

  @Get('me')
  @UseGuards(PlayerGuard)
  @ResponseMessage('PLAY_DASHBOARD_SUCCESS', 'Dashboard retrieved successfully')
  async me(@Player() player: PlayerSessionDto): Promise<PlayerDashboardResponseDto> {
    return this.playService.dashboard(player)
  }

  @Put('decisions/draft')
  @UseGuards(PlayerGuard)
  @ResponseMessage('PLAY_DRAFT_SUCCESS', 'Draft saved successfully')
  async saveDraft(@Body() body: SubmitDecisionsRequestDto, @Player() player: PlayerSessionDto): Promise<DecisionValidation> {
    return this.playService.saveDraft(player, body.decisions)
  }

  @Post('decisions/validate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(PlayerGuard)
  @ResponseMessage('PLAY_VALIDATE_SUCCESS', 'Decisions validated')
  async validate(@Body() body: SubmitDecisionsRequestDto, @Player() player: PlayerSessionDto): Promise<DecisionValidation> {
    return this.playService.validateOnly(player, body.decisions)
  }

  @Post('decisions/submit')
  @HttpCode(HttpStatus.OK)
  @UseGuards(PlayerGuard)
  @ResponseMessage('PLAY_SUBMIT_SUCCESS', 'Decisions submitted successfully')
  async submit(@Body() body: SubmitDecisionsRequestDto, @Player() player: PlayerSessionDto): Promise<DecisionValidation> {
    return this.playService.submit(player, body.decisions)
  }

  @Get('reports/:cycle')
  @UseGuards(PlayerGuard)
  @ResponseMessage('PLAY_REPORT_SUCCESS', 'Report retrieved successfully')
  async report(@Param('cycle', ParseIntPipe) cycle: number, @Player() player: PlayerSessionDto): Promise<PlayerCycleReportResponseDto> {
    return this.playService.report(player, cycle)
  }
}
