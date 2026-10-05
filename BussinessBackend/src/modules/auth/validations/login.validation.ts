import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.email().max(120),
  password: z.string().min(1).max(100),
})
