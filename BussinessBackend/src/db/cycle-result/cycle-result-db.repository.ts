import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { CycleResultDbSerializer } from './cycle-result-db.serializer'

import { CycleResultDb } from './cycle-result-db.schema'
import { CreateCycleResultDbDto, CycleResultDbDto } from './cycle-result-db.dto'

@Injectable()
export class CycleResultDbRepository {
  private readonly logger = new Logger(CycleResultDbRepository.name)

  constructor(
    @InjectModel(CycleResultDb.name) private readonly cycleResultModel: Model<CycleResultDb>,
    private readonly serializer: CycleResultDbSerializer,
  ) {}

  async createMany(data: CreateCycleResultDbDto[]): Promise<void> {
    if (!data.length) return
    // Upsert keeps the operation idempotent if a retried job reprocesses the same cycle
    await this.cycleResultModel.bulkWrite(
      data.map((item) => ({
        updateOne: {
          filter: { company_id: this.serializer.toObjectId(item.companyId), cycle: item.cycle },
          update: {
            $set: {
              game_id: this.serializer.toObjectId(item.gameId),
              report: item.report,
              applied_decisions: item.appliedDecisions,
              auto_decisions: item.autoDecisions,
              state_before: item.stateBefore,
              market_research: item.marketResearch,
            },
          },
          upsert: true,
        },
      })),
    )
    this.logger.log(`[createMany] ${data.length} results for cycle ${data[0].cycle}`)
  }

  async findByCompanyIdAndCycle(companyId: string, cycle: number): Promise<CycleResultDbDto | null> {
    const result = await this.cycleResultModel.findOne({ company_id: this.serializer.toObjectId(companyId), cycle }).lean<CycleResultDb>()
    return result ? this.serializer.toCamelCase(result) : null
  }

  async findByCompanyId(companyId: string): Promise<CycleResultDbDto[]> {
    const results = await this.cycleResultModel
      .find({ company_id: this.serializer.toObjectId(companyId) })
      .sort({ cycle: 1 })
      .lean<CycleResultDb[]>()
    return this.serializer.toCamelCaseArray(results)
  }

  async findByGameIdAndCycle(gameId: string, cycle: number): Promise<CycleResultDbDto[]> {
    const results = await this.cycleResultModel.find({ game_id: this.serializer.toObjectId(gameId), cycle }).lean<CycleResultDb[]>()
    return this.serializer.toCamelCaseArray(results)
  }
}
