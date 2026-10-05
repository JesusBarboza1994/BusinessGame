import { createParamDecorator, ExecutionContext } from '@nestjs/common'

import { PlayerSessionDto } from '@/commons/dto/authenticate.dto'

export const Player = createParamDecorator((_data: unknown, ctx: ExecutionContext): PlayerSessionDto => {
  return ctx.switchToHttp().getRequest().player as PlayerSessionDto
})
