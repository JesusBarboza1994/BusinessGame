import { z } from 'zod'

export const CreateGameSchema = z.object({
  name: z.string().trim().min(2).max(80),
  cycles: z.number().int().min(1).max(24),
  cycleDurationMinutes: z.number().min(1).max(240),
  settings: z.record(z.string(), z.unknown()).optional(),
})
