import { CompanyDecisions, CompanyState, CycleReport } from '@/modules/simulation/engine/engine.types'
import { MarketResearchReport } from '@/modules/simulation/engine/market-research.engine'

export interface CycleResultDbDto {
  id: string
  gameId: string
  companyId: string
  cycle: number
  report: CycleReport
  appliedDecisions: CompanyDecisions
  autoDecisions: boolean
  stateBefore: CompanyState
  marketResearch: MarketResearchReport | null
}

export interface CreateCycleResultDbDto {
  gameId: string
  companyId: string
  cycle: number
  report: CycleReport
  appliedDecisions: CompanyDecisions
  autoDecisions: boolean
  stateBefore: CompanyState
  marketResearch: MarketResearchReport | null
}
