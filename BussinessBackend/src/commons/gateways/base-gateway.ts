import { Logger } from '@nestjs/common'
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketServer } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

export interface RoomSubscriptionDto {
  room: string
}

export abstract class BaseGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  protected server: Server

  protected readonly logger: Logger

  protected constructor(name: string) {
    this.logger = new Logger(name)
  }

  handleConnection(client: Socket): void {
    this.logger.debug(`[handleConnection] ${client.id}`)
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`[handleDisconnect] ${client.id}`)
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(@ConnectedSocket() client: Socket, @MessageBody() payload: RoomSubscriptionDto): { subscribed: string } | { error: string } {
    if (!payload?.room || typeof payload.room !== 'string') return { error: 'room is required' }
    void client.join(payload.room)
    return { subscribed: payload.room }
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(@ConnectedSocket() client: Socket, @MessageBody() payload: RoomSubscriptionDto): { unsubscribed: string } {
    void client.leave(payload?.room)
    return { unsubscribed: payload?.room }
  }

  protected emitToRoom<T>(room: string, event: string, payload: T): void {
    this.server?.to(room).emit(event, payload)
  }
}
