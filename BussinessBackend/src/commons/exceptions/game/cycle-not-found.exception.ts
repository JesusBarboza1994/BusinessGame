import { HttpStatus } from '@nestjs/common'

import { AppException } from '../app.exception'

export class CycleNotFoundException extends AppException {
  constructor(details?: object) {
    super(HttpStatus.NOT_FOUND, 'GAME_CYCLE_NOT_FOUND', 'Cycle results not found', details)
  }
}
