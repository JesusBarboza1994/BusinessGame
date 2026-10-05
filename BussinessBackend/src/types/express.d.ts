import { AuthenticatedSessionDto, PlayerSessionDto } from '@/commons/dto/authenticate.dto'

declare global {
  namespace Express {
    interface Request {
      session?: AuthenticatedSessionDto
      player?: PlayerSessionDto
    }
  }
}

export {}
