import { createZodDto } from 'nestjs-zod'

import { JoinGameSchema } from '@/modules/play/validations/join-game.validation'

export class JoinGameRequestDto extends createZodDto(JoinGameSchema) {}
