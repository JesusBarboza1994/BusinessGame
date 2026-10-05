import { HttpStatus } from '@nestjs/common'

import { AppException } from '../app.exception'

export class GamePinUnavailableException extends AppException {
  constructor(details?: object) {
    super(HttpStatus.SERVICE_UNAVAILABLE, 'GAME_PIN_UNAVAILABLE', 'Could not generate a unique PIN, try again', details)
  }
}
