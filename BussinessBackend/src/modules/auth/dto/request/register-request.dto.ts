import { createZodDto } from 'nestjs-zod'

import { RegisterSchema } from '@/modules/auth/validations/register.validation'

export class RegisterRequestDto extends createZodDto(RegisterSchema) {}
