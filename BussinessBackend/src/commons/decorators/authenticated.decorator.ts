import { createParamDecorator, ExecutionContext } from '@nestjs/common'

import { AuthenticatedSessionDto } from '@/commons/dto/authenticate.dto'

export const Authenticated = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthenticatedSessionDto => {
  return ctx.switchToHttp().getRequest().session as AuthenticatedSessionDto
})
