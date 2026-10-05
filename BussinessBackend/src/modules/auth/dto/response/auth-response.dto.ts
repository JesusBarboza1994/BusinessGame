import { FacilitatorSessionDto } from '@/commons/dto/authenticate.dto'

export interface AuthResponseDto {
  token: string
  facilitator: FacilitatorSessionDto
}
