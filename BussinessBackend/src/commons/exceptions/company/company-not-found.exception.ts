import { HttpStatus } from '@nestjs/common'

import { AppException } from '../app.exception'

export class CompanyNotFoundException extends AppException {
  constructor(details?: object) {
    super(HttpStatus.NOT_FOUND, 'COMPANY_NOT_FOUND', 'Company not found', details)
  }
}
