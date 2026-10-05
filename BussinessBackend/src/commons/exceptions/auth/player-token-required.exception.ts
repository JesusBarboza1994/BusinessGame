import { HttpStatus } from '@nestjs/common'

import { AppException } from '../app.exception'

export class PlayerTokenRequiredException extends AppException {
  constructor(details?: object) {
    super(HttpStatus.UNAUTHORIZED, 'AUTH_PLAYER_TOKEN_REQUIRED', 'Player token is required', details)
  }
}
