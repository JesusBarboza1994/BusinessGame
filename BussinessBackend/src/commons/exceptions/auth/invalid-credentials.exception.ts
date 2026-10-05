import { HttpStatus } from '@nestjs/common'

import { AppException } from '../app.exception'

export class InvalidCredentialsException extends AppException {
  constructor(details?: object) {
    super(HttpStatus.UNAUTHORIZED, 'AUTH_INVALID_CREDENTIALS', 'Invalid email or password', details)
  }
}
