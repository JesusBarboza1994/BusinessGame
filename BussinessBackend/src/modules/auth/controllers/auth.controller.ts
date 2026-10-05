import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common'

import { AuthenticatedGuard } from '@/commons/guards/authenticated.guard'

import { AuthService } from '../services/auth.service'

import { Authenticated } from '@/commons/decorators/authenticated.decorator'
import { ResponseMessage } from '@/commons/decorators/response-message.decorator'

import { AuthenticatedSessionDto, FacilitatorSessionDto } from '@/commons/dto/authenticate.dto'
import { LoginRequestDto } from '../dto/request/login-request.dto'
import { RegisterRequestDto } from '../dto/request/register-request.dto'
import { AuthResponseDto } from '../dto/response/auth-response.dto'

// register and login are the entry points that issue tokens, so they are the only public routes here
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ResponseMessage('AUTH_REGISTER_SUCCESS', 'Facilitator registered successfully')
  async register(@Body() body: RegisterRequestDto): Promise<AuthResponseDto> {
    return this.authService.register(body)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('AUTH_LOGIN_SUCCESS', 'Logged in successfully')
  async login(@Body() body: LoginRequestDto): Promise<AuthResponseDto> {
    return this.authService.login(body)
  }

  @Get('me')
  @UseGuards(AuthenticatedGuard)
  @ResponseMessage('AUTH_ME_SUCCESS', 'Session retrieved successfully')
  me(@Authenticated() { user }: AuthenticatedSessionDto): FacilitatorSessionDto {
    return user
  }
}
