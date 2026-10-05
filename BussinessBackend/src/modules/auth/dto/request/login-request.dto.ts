import { createZodDto } from 'nestjs-zod'

import { LoginSchema } from '@/modules/auth/validations/login.validation'

export class LoginRequestDto extends createZodDto(LoginSchema) {}
