import { z } from 'zod'

export const RegisterSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.email().max(120),
  password: z.string().min(8).max(100),
})
