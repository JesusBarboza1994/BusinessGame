import { z } from 'zod'

import { PrepaymentMode } from '@/modules/simulation/engine/engine.types'

const money = z.number().finite().min(0).max(100_000_000)
const units = z.number().int().min(0).max(1_000_000)
const perProduct = <T extends z.ZodType>(schema: T) => z.object({ A: schema, B: schema })

export const DecisionsSchema = z.object({
  production: z.object({
    units: perProduct(units),
    materialPurchases: perProduct(units),
    capacityModules: z.number().int().min(0).max(10),
  }),
  marketing: z.object({
    price: perProduct(z.number().finite().positive().max(10_000)),
    advertising: perProduct(money),
    buyMarketResearch: z.boolean(),
  }),
  research: z.object({
    quality: perProduct(money),
  }),
  finance: z.object({
    shortTermLoan: money,
    longTermLoan: money,
    prepayment: z.object({ amount: money, mode: z.enum(PrepaymentMode) }),
    sharesToIssue: z.number().int().min(0).max(10_000_000),
    dividends: money,
    securitiesPurchase: money,
  }),
})

export const SubmitDecisionsSchema = z.object({ decisions: DecisionsSchema })
