import { HttpStatus } from '@nestjs/common'

import { AppException } from '../app.exception'

export class GameFullException extends AppException {
  constructor(details?: object) {
    super(HttpStatus.CONFLICT, 'GAME_FULL', 'Game is full', details)
  }
}
