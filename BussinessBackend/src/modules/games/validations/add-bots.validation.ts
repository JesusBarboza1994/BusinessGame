import { z } from 'zod'

import { BotLevel, BotStrategy } from '@/modules/simulation/engine/engine.types'

export const AddBotsSchema = z.object({
  count: z.number().int().min(1).max(10).default(1),
  strategy: z.enum(BotStrategy).optional(),
  level: z.enum(BotLevel).default(BotLevel.NORMAL),
})
