import { HttpStatus } from '@nestjs/common'

import { AppException } from '../app.exception'

export class DecisionInvalidException extends AppException {
  constructor(details?: object) {
    super(HttpStatus.UNPROCESSABLE_ENTITY, 'DECISION_INVALID', 'Decisions are not feasible', details)
  }
}
