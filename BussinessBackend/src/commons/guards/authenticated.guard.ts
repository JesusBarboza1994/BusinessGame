import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'

import { FacilitatorSessionDto } from '@/commons/dto/authenticate.dto'

import { InvalidTokenException } from '@/commons/exceptions/auth/invalid-token.exception'
import { TokenRequiredException } from '@/commons/exceptions/auth/token-required.exception'

interface FacilitatorTokenPayload {
  sub: string
  email: string
  name: string
}

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  private readonly logger = new Logger(AuthenticatedGuard.name)

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const [scheme, token] = (request.headers.authorization ?? '').split(' ')
    if (scheme !== 'Bearer' || !token) throw new TokenRequiredException()
    try {
      const payload = await this.jwtService.verifyAsync<FacilitatorTokenPayload>(token)
      const user: FacilitatorSessionDto = { id: payload.sub, email: payload.email, name: payload.name }
      request.session = { user, token }
      return true
    } catch (error) {
      this.logger.warn(`[canActivate] ${(error as Error).message}`)
      throw new InvalidTokenException()
    }
  }
}
