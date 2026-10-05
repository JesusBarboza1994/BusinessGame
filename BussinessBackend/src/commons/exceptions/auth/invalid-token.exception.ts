import { HttpStatus } from '@nestjs/common'

import { AppException } from '../app.exception'

export class InvalidTokenException extends AppException {
  constructor(details?: object) {
    super(HttpStatus.UNAUTHORIZED, 'AUTH_INVALID_TOKEN', 'Invalid or expired token', details)
  }
}
