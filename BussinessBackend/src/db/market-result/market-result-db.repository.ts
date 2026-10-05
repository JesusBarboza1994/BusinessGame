import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { MarketResultDbSerializer } from './market-result-db.serializer'

import { MarketResultDb } from './market-result-db.schema'
import { CreateMarketResultDbDto, MarketResultDbDto } from './market-result-db.dto'

@Injectable()
export class MarketResultDbRepository {
  private readonly logger = new Logger(MarketResultDbRepository.name)

  constructor(
    @InjectModel(MarketResultDb.name) private readonly marketResultModel: Model<MarketResultDb>,
    private readonly serializer: MarketResultDbSerializer,
  ) {}

  async create(data: CreateMarketResultDbDto): Promise<void> {
    await this.marketResultModel.updateOne(
      { game_id: this.serializer.toObjectId(data.gameId), cycle: data.cycle },
      { $set: { result: data.result, ranking: data.ranking } },
      { upsert: true },
    )
    this.logger.log(`[create] market result game ${data.gameId} cycle ${data.cycle}`)
  }

  async findByGameIdAndCycle(gameId: string, cycle: number): Promise<MarketResultDbDto | null> {
    const result = await this.marketResultModel.findOne({ game_id: this.serializer.toObjectId(gameId), cycle }).lean<MarketResultDb>()
    return result ? this.serializer.toCamelCase(result) : null
  }

  async findByGameId(gameId: string): Promise<MarketResultDbDto[]> {
    const results = await this.marketResultModel
      .find({ game_id: this.serializer.toObjectId(gameId) })
      .sort({ cycle: 1 })
      .lean<MarketResultDb[]>()
    return this.serializer.toCamelCaseArray(results)
  }
}
