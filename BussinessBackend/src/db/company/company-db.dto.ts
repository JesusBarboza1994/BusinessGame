import { BotProfile, CompanyState, CompanyStatus, ValuationMethod } from '@/modules/simulation/engine/engine.types'

export interface CompanyDbDto {
  id: string
  gameId: string
  name: string
  avatar: string
  color: string
  tokenExpiresAt: Date
  valuationMethod: ValuationMethod
  status: CompanyStatus
  state: CompanyState
  isBot: boolean
  botProfile: BotProfile | null
  createdAt: Date
}

export interface CreateCompanyDbDto {
  gameId: string
  name: string
  avatar: string
  color: string
  playerTokenHash: string
  tokenExpiresAt: Date
  valuationMethod: ValuationMethod
  state: CompanyState
  botProfile?: BotProfile
}
