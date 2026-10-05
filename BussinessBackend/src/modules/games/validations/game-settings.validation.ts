import { z } from 'zod'

import { RankingMetric } from '@/modules/simulation/engine/engine.types'

const positive = z.number().finite().positive()
const nonNegative = z.number().finite().min(0)
const rate = z.number().finite().min(0).max(1)
const perProduct = <T extends z.ZodType>(schema: T) => z.object({ A: schema, B: schema })
const segment = z.object({ weight: rate, quality: nonNegative.max(10), marketing: nonNegative.max(10), price: nonNegative.max(10) })

export const GameSettingsSchema = z.object({
  cycles: z.number().int().min(1).max(24),
  seed: z.number().int().min(1),
  initial: z.object({
    cash: nonNegative,
    capacity: positive.int(),
    materials: perProduct(nonNegative.int()),
    shares: positive.int(),
    shareParValue: positive,
  }),
  production: z.object({
    moduleUnits: positive.int(),
    moduleCostPerUnit: nonNegative,
    depreciationRate: rate,
    materialCost: perProduct(nonNegative),
    laborCost: perProduct(nonNegative),
    variableOverhead: perProduct(nonNegative),
    capacityUsage: perProduct(positive),
  }),
  market: z.object({
    targetUtilization: positive.max(3),
    growth: z.number().min(-0.5).max(1),
    growthNoise: rate,
    elasticity: nonNegative.max(5),
    refPrice: perProduct(positive),
    baseQuality: perProduct(positive),
    qualityDecay: rate,
    marketingDecay: rate,
    qualityHalfSaturation: positive,
    marketingHalfSaturation: positive,
    noiseSigma: rate,
    substitutionRate: rate,
    latentDemandRate: rate,
    stockoutReputationLoss: rate,
    segments: z.object({ PRICE: segment, QUALITY: segment }),
    economySegmentShift: rate,
    priceSegmentBounds: z.tuple([rate, rate]),
  }),
  economy: z.object({
    drift: z.number().min(-0.2).max(0.2),
    volatility: rate,
    forecastNoiseQuarter: rate,
    forecastNoiseYear: rate,
  }),
  costs: z.object({
    adminFixed: nonNegative,
    adminVariableRate: rate,
    adminNoise: rate,
    holdingCost: z.object({ finished: nonNegative, materials: nonNegative }),
    marketResearchCost: nonNegative,
  }),
  finance: z.object({
    shortTermRate: rate,
    emergencyRate: rate,
    emergencyBuffer: rate,
    longTermAnnualRate: rate,
    longTermQuarters: z.number().int().min(1).max(80),
    prepaymentPenalty: rate,
    creditLimitMultiple: nonNegative.max(10),
    securitiesRate: rate,
    taxRate: rate,
    lossCarryForwardMaxCycles: z.number().int().min(1).nullable(),
    lossCarryForwardMaxOffset: rate,
    issueDiscount: rate,
    issueCost: rate,
    costOfEquity: positive.max(1),
    legalReserveEnabled: z.boolean(),
    legalReserveRate: rate,
    legalReserveCap: rate,
    priceToBookBounds: z.tuple([positive, positive]),
    priceSensitivity: nonNegative.max(5),
  }),
  bankruptcy: z.object({
    emergencyStreakLimit: z.number().int().min(1).max(20),
    insolvencyLossRatio: rate,
  }),
  rankingMetric: z.enum(RankingMetric),
})
