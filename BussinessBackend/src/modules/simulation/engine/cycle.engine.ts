import { applyFinancing, closeCompany, gameRoe, openCycle, produce, startWorking, totalEquity, updateIntangibles, valuate, WorkingCompany } from './company.engine'
import { MarketOfferingInput, runMarket } from './market.engine'
import { roundDeep } from './math.util'
import { createRng, hashSeed } from './random.util'

import { PRODUCTS } from './engine.constant'
import {
  CompanyState,
  CompanyStatus,
  CycleCompanyOutput,
  CycleInput,
  CycleOutput,
  GameSettings,
  MarketState,
  OfferingResult,
  RankingEntry,
  RankingMetric,
} from './engine.types'

const SALT_CYCLE = 101

export function createInitialMarketState(companies: number): MarketState {
  return { cycle: 0, growthIndex: 1, latentDemand: 0, initialCompanies: companies }
}

export function runCycle(input: CycleInput): CycleOutput {
  const { settings, cycle, economy } = input
  const rng = createRng(hashSeed(settings.seed, cycle, SALT_CYCLE))
  const companies = [...input.companies].sort((a, b) => a.id.localeCompare(b.id))

  const working: WorkingCompany[] = companies
    .filter((company) => company.state.status === CompanyStatus.ACTIVE)
    .map((company) => {
      const w = startWorking(company.id, company.state, company.decisions)
      openCycle(settings, w)
      applyFinancing(settings, w, cycle)
      produce(settings, w)
      updateIntangibles(settings, w)
      return w
    })

  const offerings: MarketOfferingInput[] = working.flatMap((w) =>
    PRODUCTS.map((product) => ({
      companyId: w.id,
      product,
      price: w.decisions.marketing.price[product],
      advertising: w.decisions.marketing.advertising[product],
      qualityIndex: w.qualityIndex[product],
      marketingIndex: w.marketingIndex[product],
      available: w.state.finishedGoods[product].reduce((acc, layer) => acc + layer.units, 0),
    })),
  )
  const market = runMarket(settings, cycle, input.market, economy, offerings, rng)

  const findOffering = (companyId: string, product: string): OfferingResult | null =>
    market.result.offerings.find((o) => o.companyId === companyId && o.product === product) ?? null

  const outputs: CycleCompanyOutput[] = companies.map((company) => {
    const w = working.find((item) => item.id === company.id)
    if (!w) return { id: company.id, state: company.state, report: null, appliedDecisions: null }
    const report = closeCompany(settings, w, {
      cycle,
      rng,
      offerings: { A: findOffering(w.id, 'A'), B: findOffering(w.id, 'B') },
    })
    return { id: company.id, state: w.state, report: roundDeep(report), appliedDecisions: w.decisions }
  })

  return {
    market: market.nextMarket,
    marketResult: market.result,
    companies: outputs,
    ranking: buildRanking(settings, outputs.map((o) => ({ id: o.id, state: o.state })), market.result.offerings),
  }
}

export function buildRanking(settings: GameSettings, companies: { id: string; state: CompanyState }[], offerings: OfferingResult[] = []): RankingEntry[] {
  const entries = companies.map(({ id, state }) => {
    const valuation = valuate(settings, state)
    const marketShare = offerings.filter((o) => o.companyId === id).reduce((acc, o) => acc + o.share, 0)
    const score =
      settings.rankingMetric === RankingMetric.ROI ? valuation.roi : settings.rankingMetric === RankingMetric.ROE ? gameRoe(state) : valuation.tsr
    return {
      position: 0,
      companyId: id,
      status: state.status,
      score,
      sharePrice: state.status === CompanyStatus.BANKRUPT ? 0 : state.sharePrice,
      tsr: valuation.tsr,
      roi: valuation.roi,
      roeAnnual: valuation.roeAnnual,
      marketShare,
      equity: totalEquity(state),
      bankruptCycle: state.bankruptCycle ?? 0,
    }
  })
  entries.sort((a, b) => {
    if (a.status !== b.status) return a.status === CompanyStatus.ACTIVE ? -1 : 1
    if (a.status === CompanyStatus.BANKRUPT) return b.bankruptCycle - a.bankruptCycle
    return b.score - a.score || b.marketShare - a.marketShare
  })
  return entries.map(({ bankruptCycle: _bankruptCycle, ...entry }, index) => roundDeep({ ...entry, position: index + 1 }))
}
