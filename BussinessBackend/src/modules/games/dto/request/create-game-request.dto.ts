import { createZodDto } from 'nestjs-zod'

import { CreateGameSchema } from '@/modules/games/validations/create-game.validation'

export class CreateGameRequestDto extends createZodDto(CreateGameSchema) {}
