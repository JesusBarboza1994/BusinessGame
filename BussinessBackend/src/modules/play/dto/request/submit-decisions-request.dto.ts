import { createZodDto } from 'nestjs-zod'

import { SubmitDecisionsSchema } from '@/modules/play/validations/decisions.validation'

export class SubmitDecisionsRequestDto extends createZodDto(SubmitDecisionsSchema) {}
