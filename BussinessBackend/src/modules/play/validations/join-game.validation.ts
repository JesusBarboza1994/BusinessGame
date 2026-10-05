import { z } from 'zod'

import { ValuationMethod } from '@/modules/simulation/engine/engine.types'

export const JoinGameSchema = z.object({
  pin: z.string().trim().regex(/^\d{6}$/, 'PIN must have 6 digits'),
  companyName: z.string().trim().min(2).max(30),
  avatar: z.string().trim().min(1).max(16),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  valuationMethod: z.enum(ValuationMethod).default(ValuationMethod.WEIGHTED_AVERAGE),
})
