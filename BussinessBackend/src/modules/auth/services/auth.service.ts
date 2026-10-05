import { Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { compare, hash } from 'bcryptjs'

import { FacilitatorDbRepository } from '@/db/facilitator/facilitator-db.repository'

import { FacilitatorSessionDto } from '@/commons/dto/authenticate.dto'
import { FacilitatorDbDto } from '@/db/facilitator/facilitator-db.dto'
import { LoginRequestDto } from '../dto/request/login-request.dto'
import { RegisterRequestDto } from '../dto/request/register-request.dto'
import { AuthResponseDto } from '../dto/response/auth-response.dto'

import { EmailAlreadyRegisteredException } from '@/commons/exceptions/auth/email-already-registered.exception'
import { InvalidCredentialsException } from '@/commons/exceptions/auth/invalid-credentials.exception'

const BCRYPT_ROUNDS = 10

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly facilitatorRepository: FacilitatorDbRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(body: RegisterRequestDto): Promise<AuthResponseDto> {
    if (await this.facilitatorRepository.findByEmail(body.email)) throw new EmailAlreadyRegisteredException()
    const facilitator = await this.facilitatorRepository.create({
      name: body.name,
      email: body.email,
      passwordHash: await hash(body.password, BCRYPT_ROUNDS),
    })
    this.logger.log(`[register] facilitator ${facilitator.id}`)
    return this.issue(facilitator)
  }

  async login(body: LoginRequestDto): Promise<AuthResponseDto> {
    const facilitator = await this.facilitatorRepository.findByEmail(body.email)
    if (!facilitator || !(await compare(body.password, facilitator.passwordHash))) throw new InvalidCredentialsException()
    return this.issue(facilitator)
  }

  private async issue(facilitator: FacilitatorDbDto): Promise<AuthResponseDto> {
    const session: FacilitatorSessionDto = { id: facilitator.id, email: facilitator.email, name: facilitator.name }
    const token = await this.jwtService.signAsync({ sub: session.id, email: session.email, name: session.name })
    return { token, facilitator: session }
  }
}
