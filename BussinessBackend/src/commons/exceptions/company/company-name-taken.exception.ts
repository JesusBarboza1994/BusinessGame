import { HttpStatus } from '@nestjs/common'

import { AppException } from '../app.exception'

export class CompanyNameTakenException extends AppException {
  constructor(details?: object) {
    super(HttpStatus.CONFLICT, 'COMPANY_NAME_TAKEN', 'Company name already taken in this game', details)
  }
}
