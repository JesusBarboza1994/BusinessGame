import { CycleCloseReason } from '@/commons/constants/game.constant'

export interface CycleCloseJobDto {
  gameId: string
  cycle: number
  reason: CycleCloseReason
}
