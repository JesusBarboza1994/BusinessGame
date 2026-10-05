import { Injectable } from '@nestjs/common'
import { Types } from 'mongoose'

import { MarketResultDb } from './market-result-db.schema'

import { MarketResultDbDto } from './market-result-db.dto'

@Injectable()
export class MarketResultDbSerializer {
  toCamelCase(result: MarketResultDb): MarketResultDbDto {
    return {
      id: result._id.toString(),
      gameId: result.game_id.toString(),
      cycle: result.cycle,
      result: result.result,
      ranking: result.ranking,
    }
  }

  toCamelCaseArray(results: MarketResultDb[]): MarketResultDbDto[] {
    return results.map((result) => this.toCamelCase(result))
  }

  toObjectId(id: string): Types.ObjectId {
    return new Types.ObjectId(id)
  }
}
