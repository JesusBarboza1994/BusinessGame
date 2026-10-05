import { createZodDto } from 'nestjs-zod'

import { AddBotsSchema } from '@/modules/games/validations/add-bots.validation'

export class AddBotsRequestDto extends createZodDto(AddBotsSchema) {}
