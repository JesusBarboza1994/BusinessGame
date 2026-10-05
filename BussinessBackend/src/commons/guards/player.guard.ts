import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common'
import { Request } from 'express'

import { CompanyDbRepository } from '@/db/company/company-db.repository'

import { hashToken } from '@/commons/helpers/token.helper'

import { PLAYER_TOKEN_HEADER } from '@/commons/constants/game.constant'

import { InvalidPlayerTokenException } from '@/commons/exceptions/auth/invalid-player-token.exception'
import { PlayerTokenRequiredException } from '@/commons/exceptions/auth/player-token-required.exception'

// Kahoot-style access: players carry the opaque token they received when joining with the PIN
@Injectable()
export class PlayerGuard implements CanActivate {
  private readonly logger = new Logger(PlayerGuard.name)

  constructor(private readonly companyRepository: CompanyDbRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const token = request.headers[PLAYER_TOKEN_HEADER]
    if (typeof token !== 'string' || !token) throw new PlayerTokenRequiredException()
    const company = await this.companyRepository.findByTokenHash(hashToken(token))
    if (!company || company.tokenExpiresAt.getTime() < Date.now()) {
      this.logger.warn('[canActivate] invalid or expired player token')
      throw new InvalidPlayerTokenException()
    }
    request.player = { companyId: company.id, gameId: company.gameId }
    return true
  }
}
