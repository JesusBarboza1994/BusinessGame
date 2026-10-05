import { HttpStatus } from '@nestjs/common'

import { AppException } from '../app.exception'

export class GameNotInLobbyException extends AppException {
  constructor(details?: object) {
    super(HttpStatus.CONFLICT, 'GAME_NOT_IN_LOBBY', 'Game already started', details)
  }
}
