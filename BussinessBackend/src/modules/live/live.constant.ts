export enum LiveEvent {
  LOBBY_UPDATED = 'lobby.updated',
  GAME_STARTED = 'game.started',
  DECISION_SUBMITTED = 'decision.submitted',
  CYCLE_PROCESSING = 'cycle.processing',
  CYCLE_CLOSED = 'cycle.closed',
  GAME_FINISHED = 'game.finished',
}

export const gameRoom = (gameId: string): string => `game:${gameId}`
