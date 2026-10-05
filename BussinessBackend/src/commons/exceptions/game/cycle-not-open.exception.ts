import { HttpStatus } from '@nestjs/common'

import { AppException } from '../app.exception'

export class CycleNotOpenException extends AppException {
  constructor(details?: object) {
    super(HttpStatus.CONFLICT, 'GAME_CYCLE_NOT_OPEN', 'Current cycle is not accepting decisions', details)
  }
}
