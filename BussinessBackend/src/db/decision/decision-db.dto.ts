import { CompanyDecisions } from '@/modules/simulation/engine/engine.types'

export interface DecisionDbDto {
  id: string
  gameId: string
  companyId: string
  cycle: number
  decisions: CompanyDecisions
  submitted: boolean
  auto: boolean
  submittedAt: Date | null
}

export interface UpsertDecisionDbDto {
  gameId: string
  companyId: string
  cycle: number
  decisions: CompanyDecisions
  submitted: boolean
  auto: boolean
}
