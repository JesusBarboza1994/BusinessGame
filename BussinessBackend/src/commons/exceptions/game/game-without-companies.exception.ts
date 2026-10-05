import { HttpStatus } from '@nestjs/common'

import { AppException } from '../app.exception'

export class GameWithoutCompaniesException extends AppException {
  constructor(details?: object) {
    super(HttpStatus.CONFLICT, 'GAME_WITHOUT_COMPANIES', 'At least one company must join before starting', details)
  }
}
