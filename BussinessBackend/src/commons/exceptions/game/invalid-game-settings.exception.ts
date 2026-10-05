import { HttpStatus } from '@nestjs/common'

import { AppException } from '../app.exception'

export class InvalidGameSettingsException extends AppException {
  constructor(details?: object) {
    super(HttpStatus.BAD_REQUEST, 'GAME_INVALID_SETTINGS', 'Invalid game settings', details)
  }
}
