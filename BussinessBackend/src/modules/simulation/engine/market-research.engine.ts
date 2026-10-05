import { roundDeep } from './math.util'
import { createRng, hashSeed } from './random.util'

import { GameSettings, MarketCycleResult, Product, Segment } from './engine.types'

const SALT_RESEARCH = 303
const ADVERTISING_NOISE = 0.1

export interface CompetitorInsight {
  companyId: string
  product: Product
  price: number
  estimatedAdvertising: number
  share: number
  sales: number
  shareBySegment: Record<Segment, number>
  qualityRank: number
}

export interface MarketResearchReport {
  cycle: number
  marketSize: number
  segmentDemand: Record<Segment, number>
  segmentWeights: Record<Segment, number>
  unservedDemand: number
  nextMarketSizeForecast: number
  competitors: CompetitorInsight[]
}

// Paid study: what a real market-research firm could observe, with noise on non-public figures
export function buildMarketResearch(settings: GameSettings, result: MarketCycleResult, nextEconomyForecast: number): MarketResearchReport {
  const rng = createRng(hashSeed(settings.seed, result.cycle, SALT_RESEARCH))
  const qualityOrder = [...result.offerings].sort((a, b) => b.qualityIndex - a.qualityIndex)
  const segments: Segment[] = ['PRICE', 'QUALITY']
  const segmentTotals = Object.fromEntries(
    segments.map((s) => [s, result.offerings.reduce((acc, o) => acc + o.demandBySegment[s], 0)]),
  ) as Record<Segment, number>
  return roundDeep({
    cycle: result.cycle,
    marketSize: result.marketSize,
    segmentDemand: result.segmentDemand,
    segmentWeights: result.segmentWeights,
    unservedDemand: result.unservedDemand,
    nextMarketSizeForecast:
      (result.marketSize - result.latentDemandIn) * (1 + settings.market.growth) * (nextEconomyForecast / result.economyIndex) + result.latentDemandOut,
    competitors: result.offerings.map((o) => ({
      companyId: o.companyId,
      product: o.product,
      price: o.price,
      estimatedAdvertising: o.advertising * rng.uniform(1 - ADVERTISING_NOISE, 1 + ADVERTISING_NOISE),
      share: o.share,
      sales: o.sales,
      shareBySegment: Object.fromEntries(
        segments.map((s) => [s, segmentTotals[s] > 0 ? o.demandBySegment[s] / segmentTotals[s] : 0]),
      ) as Record<Segment, number>,
      qualityRank: qualityOrder.indexOf(o) + 1,
    })),
  })
}
