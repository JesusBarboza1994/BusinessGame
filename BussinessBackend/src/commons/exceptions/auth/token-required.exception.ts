import { HttpStatus } from '@nestjs/common'

import { AppException } from '../app.exception'

export class TokenRequiredException extends AppException {
  constructor(details?: object) {
    super(HttpStatus.UNAUTHORIZED, 'AUTH_TOKEN_REQUIRED', 'Authorization token is required', details)
  }
}
