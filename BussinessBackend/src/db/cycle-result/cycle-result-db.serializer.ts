import { Injectable } from '@nestjs/common'
import { Types } from 'mongoose'

import { CycleResultDb } from './cycle-result-db.schema'

import { CycleResultDbDto } from './cycle-result-db.dto'

@Injectable()
export class CycleResultDbSerializer {
  toCamelCase(result: CycleResultDb): CycleResultDbDto {
    return {
      id: result._id.toString(),
      gameId: result.game_id.toString(),
      companyId: result.company_id.toString(),
      cycle: result.cycle,
      report: result.report,
      appliedDecisions: result.applied_decisions,
      autoDecisions: result.auto_decisions,
      stateBefore: result.state_before,
      marketResearch: result.market_research,
    }
  }

  toCamelCaseArray(results: CycleResultDb[]): CycleResultDbDto[] {
    return results.map((result) => this.toCamelCase(result))
  }

  toObjectId(id: string): Types.ObjectId {
    return new Types.ObjectId(id)
  }
}
