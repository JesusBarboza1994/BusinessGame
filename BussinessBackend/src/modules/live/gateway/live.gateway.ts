import { Injectable } from '@nestjs/common'
import { WebSocketGateway } from '@nestjs/websockets'

import { BaseGateway } from '@/commons/gateways/base-gateway'

import { gameRoom, LiveEvent } from '../live.constant'
import {
  CycleClosedGatewayResponseDto,
  CycleProcessingGatewayResponseDto,
  DecisionSubmittedGatewayResponseDto,
  GameStartedGatewayResponseDto,
  LobbyUpdatedGatewayResponseDto,
} from '../dto/gateway/live-gateway-response.dto'

@Injectable()
@WebSocketGateway({ namespace: '/live', cors: { origin: true, credentials: true } })
export class LiveGateway extends BaseGateway {
  constructor() {
    super(LiveGateway.name)
  }

  notifyLobbyUpdated(payload: LobbyUpdatedGatewayResponseDto): void {
    this.safeEmit('notifyLobbyUpdated', payload.gameId, LiveEvent.LOBBY_UPDATED, payload)
  }

  notifyGameStarted(payload: GameStartedGatewayResponseDto): void {
    this.safeEmit('notifyGameStarted', payload.gameId, LiveEvent.GAME_STARTED, payload)
  }

  notifyDecisionSubmitted(payload: DecisionSubmittedGatewayResponseDto): void {
    this.safeEmit('notifyDecisionSubmitted', payload.gameId, LiveEvent.DECISION_SUBMITTED, payload)
  }

  notifyCycleProcessing(payload: CycleProcessingGatewayResponseDto): void {
    this.safeEmit('notifyCycleProcessing', payload.gameId, LiveEvent.CYCLE_PROCESSING, payload)
  }

  notifyCycleClosed(payload: CycleClosedGatewayResponseDto): void {
    this.safeEmit('notifyCycleClosed', payload.gameId, LiveEvent.CYCLE_CLOSED, payload)
    if (payload.finished) this.safeEmit('notifyCycleClosed', payload.gameId, LiveEvent.GAME_FINISHED, payload)
  }

  private safeEmit<T>(method: string, gameId: string, event: LiveEvent, payload: T): void {
    try {
      this.emitToRoom<T>(gameRoom(gameId), event, payload)
    } catch (error) {
      this.logger.error(`[${method}] ${(error as Error).message}`)
    }
  }
}
