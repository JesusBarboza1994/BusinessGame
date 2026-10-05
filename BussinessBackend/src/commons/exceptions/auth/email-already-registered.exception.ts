import { HttpStatus } from '@nestjs/common'

import { AppException } from '../app.exception'

export class EmailAlreadyRegisteredException extends AppException {
  constructor(details?: object) {
    super(HttpStatus.CONFLICT, 'AUTH_EMAIL_ALREADY_REGISTERED', 'Email is already registered', details)
  }
}
