import { HttpStatus } from '@nestjs/common'

import { AppException } from '../app.exception'

export class CompanyBankruptException extends AppException {
  constructor(details?: object) {
    super(HttpStatus.CONFLICT, 'COMPANY_BANKRUPT', 'Company is bankrupt and out of the game', details)
  }
}
