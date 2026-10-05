import { HttpStatus } from '@nestjs/common'

import { AppException } from '../app.exception'

export class GameNotFoundException extends AppException {
  constructor(details?: object) {
    super(HttpStatus.NOT_FOUND, 'GAME_NOT_FOUND', 'Game not found', details)
  }
}
