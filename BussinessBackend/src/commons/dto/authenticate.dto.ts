export interface FacilitatorSessionDto {
  id: string
  email: string
  name: string
}

export interface AuthenticatedSessionDto {
  user: FacilitatorSessionDto
  token: string
}

export interface PlayerSessionDto {
  companyId: string
  gameId: string
}
