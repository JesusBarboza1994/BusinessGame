import { HttpStatus } from '@nestjs/common'

import { AppException } from '../app.exception'

export class InvalidPlayerTokenException extends AppException {
  constructor(details?: object) {
    super(HttpStatus.UNAUTHORIZED, 'AUTH_INVALID_PLAYER_TOKEN', 'Invalid or expired player token', details)
  }
}
