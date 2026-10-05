import { HttpStatus } from '@nestjs/common'

import { AppException } from '../app.exception'

export class GameNotInProgressException extends AppException {
  constructor(details?: object) {
    super(HttpStatus.CONFLICT, 'GAME_NOT_IN_PROGRESS', 'Game is not in progress', details)
  }
}
