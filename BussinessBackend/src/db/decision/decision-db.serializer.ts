import { Injectable } from '@nestjs/common'
import { Types } from 'mongoose'

import { DecisionDb } from './decision-db.schema'

import { DecisionDbDto } from './decision-db.dto'

@Injectable()
export class DecisionDbSerializer {
  toCamelCase(decision: DecisionDb): DecisionDbDto {
    return {
      id: decision._id.toString(),
      gameId: decision.game_id.toString(),
      companyId: decision.company_id.toString(),
      cycle: decision.cycle,
      decisions: decision.decisions,
      submitted: decision.submitted,
      auto: decision.auto,
      submittedAt: decision.submitted_at,
    }
  }

  toCamelCaseArray(decisions: DecisionDb[]): DecisionDbDto[] {
    return decisions.map((decision) => this.toCamelCase(decision))
  }

  toObjectId(id: string): Types.ObjectId {
    return new Types.ObjectId(id)
  }
}
