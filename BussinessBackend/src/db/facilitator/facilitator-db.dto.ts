export interface FacilitatorDbDto {
  id: string
  name: string
  email: string
  passwordHash: string
  createdAt: Date
}

export interface CreateFacilitatorDbDto {
  name: string
  email: string
  passwordHash: string
}
