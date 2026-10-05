export enum GameStatus {
  LOBBY = 'LOBBY',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
}

export enum CycleStatus {
  OPEN = 'OPEN',
  PROCESSING = 'PROCESSING',
  CLOSED = 'CLOSED',
}

export enum CycleCloseReason {
  ALL_SUBMITTED = 'ALL_SUBMITTED',
  DEADLINE = 'DEADLINE',
  FORCED = 'FORCED',
}

export const GAME_PIN_LENGTH = 6
export const MAX_COMPANIES_PER_GAME = 30
export const PLAYER_TOKEN_HEADER = 'x-player-token'
