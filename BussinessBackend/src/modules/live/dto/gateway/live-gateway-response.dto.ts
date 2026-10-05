export interface LobbyUpdatedGatewayResponseDto {
  gameId: string
  companies: { id: string; name: string; avatar: string; color: string; isBot: boolean }[]
}

export interface GameStartedGatewayResponseDto {
  gameId: string
  cycle: number
  deadline: string | null
}

export interface DecisionSubmittedGatewayResponseDto {
  gameId: string
  cycle: number
  submitted: number
  total: number
  submittedCompanyIds: string[]
}

export interface CycleProcessingGatewayResponseDto {
  gameId: string
  cycle: number
  reason: string
}

export interface CycleClosedGatewayResponseDto {
  gameId: string
  closedCycle: number
  nextCycle: number | null
  deadline: string | null
  finished: boolean
}
