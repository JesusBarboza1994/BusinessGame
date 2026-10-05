import { clamp, sum } from './math.util'
import { Rng } from './random.util'

import { SEGMENTS } from './engine.constant'
import {
  EconomySeries,
  GameSettings,
  MarketCycleResult,
  MarketState,
  OfferingResult,
  PerProduct,
  Product,
  Segment,
} from './engine.types'

const REALLOCATION_ROUNDS = 3
const EPS = 1e-9

export interface MarketOfferingInput {
  companyId: string
  product: Product
  price: number
  advertising: number
  qualityIndex: number
  marketingIndex: number
  available: number
}

export function computeQualityIndex(settings: GameSettings, product: Product, qualityStock: number): number {
  const { baseQuality, qualityHalfSaturation } = settings.market
  return baseQuality[product] * (1 + qualityStock / (qualityStock + qualityHalfSaturation))
}

export function computeMarketingIndex(settings: GameSettings, marketingStock: number): number {
  return 1 + marketingStock / (marketingStock + settings.market.marketingHalfSaturation)
}

export function economyAt(economy: EconomySeries, cycle: number): number {
  return economy.index[Math.min(cycle, economy.index.length - 1)]
}

export function segmentWeights(settings: GameSettings, economyIndex: number): Record<Segment, number> {
  const { segments, economySegmentShift, priceSegmentBounds } = settings.market
  const price = clamp(
    segments.PRICE.weight + (economySegmentShift * (100 - economyIndex)) / 100,
    priceSegmentBounds[0],
    priceSegmentBounds[1],
  )
  return { PRICE: price, QUALITY: 1 - price }
}

export function baseMarketSize(settings: GameSettings, market: MarketState, growthIndex: number, economyIndex: number, priceIndex: number): number {
  const { initial } = settings
  const { targetUtilization, elasticity } = settings.market
  return market.initialCompanies * initial.capacity * targetUtilization * growthIndex * (economyIndex / 100) * Math.pow(priceIndex, -elasticity)
}

export function runMarket(
  settings: GameSettings,
  cycle: number,
  market: MarketState,
  economy: EconomySeries,
  offerings: MarketOfferingInput[],
  rng: Rng,
): { result: MarketCycleResult; nextMarket: MarketState } {
  const { refPrice, segments, noiseSigma, substitutionRate, latentDemandRate, growth, growthNoise } = settings.market
  const economyIndex = economyAt(economy, cycle)
  const growthIndex = market.growthIndex * (1 + growth + rng.normal(0, growthNoise))
  const priceIndex = offerings.length ? sum(offerings.map((o) => o.price / refPrice[o.product])) / offerings.length : 1
  const marketSize = baseMarketSize(settings, market, growthIndex, economyIndex, priceIndex) + market.latentDemand
  const weights = segmentWeights(settings, economyIndex)
  const segmentDemand = { PRICE: marketSize * weights.PRICE, QUALITY: marketSize * weights.QUALITY }
  const meanPrice = offerings.length ? sum(offerings.map((o) => o.price)) / offerings.length : 1

  const attractiveness = offerings.map((offering) => {
    const noise = rng.logNormal(noiseSigma)
    const relativePrice = offering.price / meanPrice
    const bySegment = {} as Record<Segment, number>
    for (const segment of SEGMENTS) {
      const w = segments[segment]
      bySegment[segment] =
        Math.pow(offering.qualityIndex, w.quality) *
        Math.pow(offering.marketingIndex, w.marketing) *
        Math.pow(relativePrice, -w.price) *
        noise
    }
    return bySegment
  })

  const totalAttr = (segment: Segment, filter: (index: number) => boolean): number =>
    sum(attractiveness.map((attr, index) => (filter(index) ? attr[segment] : 0)))

  const demandBySegment = offerings.map((_, index) => {
    const bySegment = {} as Record<Segment, number>
    for (const segment of SEGMENTS) {
      const total = totalAttr(segment, () => true)
      bySegment[segment] = total > 0 ? (segmentDemand[segment] * attractiveness[index][segment]) / total : 0
    }
    return bySegment
  })
  const demand = demandBySegment.map((bySegment) => sum(SEGMENTS.map((segment) => bySegment[segment])))

  const sales = offerings.map((offering, index) => Math.min(demand[index], offering.available))
  const remaining = offerings.map((offering, index) => offering.available - sales[index])
  let unmet = demandBySegment.map((bySegment, index) => {
    const unservedRatio = demand[index] > EPS ? 1 - sales[index] / demand[index] : 0
    const out = {} as Record<Segment, number>
    for (const segment of SEGMENTS) out[segment] = bySegment[segment] * unservedRatio
    return out
  })

  // Customers that could not buy their first choice look for the next most attractive offer with stock
  for (let round = 0; round < REALLOCATION_ROUNDS; round++) {
    const hasStock = (index: number) => remaining[index] > EPS
    if (!offerings.some((_, index) => hasStock(index))) break
    const pool = {} as Record<Segment, number>
    for (const segment of SEGMENTS) pool[segment] = substitutionRate * sum(unmet.map((u) => u[segment]))
    if (sum(SEGMENTS.map((segment) => pool[segment])) < EPS) break

    const allocation = offerings.map((_, index) => {
      const out = {} as Record<Segment, number>
      for (const segment of SEGMENTS) {
        const total = totalAttr(segment, hasStock)
        out[segment] = hasStock(index) && total > 0 ? (pool[segment] * attractiveness[index][segment]) / total : 0
      }
      return out
    })
    unmet = allocation.map((bySegment, index) => {
      const allocated = sum(SEGMENTS.map((segment) => bySegment[segment]))
      const taken = Math.min(allocated, remaining[index])
      sales[index] += taken
      remaining[index] -= taken
      const ratio = allocated > EPS ? 1 - taken / allocated : 0
      const out = {} as Record<Segment, number>
      for (const segment of SEGMENTS) out[segment] = bySegment[segment] * ratio
      return out
    })
  }

  const finalSales = sales.map((value, index) => Math.min(offerings[index].available, Math.floor(value + 1e-6)))
  const totalSold = sum(finalSales)
  const offeringResults: OfferingResult[] = offerings.map((offering, index) => ({
    companyId: offering.companyId,
    product: offering.product,
    price: offering.price,
    advertising: offering.advertising,
    qualityIndex: offering.qualityIndex,
    marketingIndex: offering.marketingIndex,
    attractiveness: attractiveness[index],
    demand: Math.round(demand[index]),
    demandBySegment: demandBySegment[index],
    sales: finalSales[index],
    lostSales: Math.max(0, Math.round(demand[index] - Math.min(demand[index], offering.available))),
    share: totalSold > 0 ? finalSales[index] / totalSold : 0,
  }))

  const perProduct = (fn: (product: Product) => number): PerProduct<number> => ({ A: fn('A'), B: fn('B') })
  const ofProduct = (product: Product) => offeringResults.filter((o) => o.product === product)
  const unservedDemand = Math.max(0, marketSize - totalSold)
  const latentDemandOut = latentDemandRate * unservedDemand

  return {
    result: {
      cycle,
      economyIndex,
      growthIndex,
      priceIndex,
      marketSize,
      latentDemandIn: market.latentDemand,
      latentDemandOut,
      segmentWeights: weights,
      segmentDemand,
      averagePrice: perProduct((product) => {
        const list = ofProduct(product)
        return list.length ? sum(list.map((o) => o.price)) / list.length : 0
      }),
      totalSales: perProduct((product) => sum(ofProduct(product).map((o) => o.sales))),
      unservedDemand,
      offerings: offeringResults,
    },
    nextMarket: { ...market, cycle, growthIndex, latentDemand: latentDemandOut },
  }
}
