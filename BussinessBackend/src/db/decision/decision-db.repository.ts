import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { DecisionDbSerializer } from './decision-db.serializer'

import { DecisionDb } from './decision-db.schema'
import { DecisionDbDto, UpsertDecisionDbDto } from './decision-db.dto'

@Injectable()
export class DecisionDbRepository {
  private readonly logger = new Logger(DecisionDbRepository.name)

  constructor(
    @InjectModel(DecisionDb.name) private readonly decisionModel: Model<DecisionDb>,
    private readonly serializer: DecisionDbSerializer,
  ) {}

  async upsert(data: UpsertDecisionDbDto): Promise<DecisionDbDto> {
    const decision = await this.decisionModel
      .findOneAndUpdate(
        { company_id: this.serializer.toObjectId(data.companyId), cycle: data.cycle },
        {
          $set: {
            game_id: this.serializer.toObjectId(data.gameId),
            decisions: data.decisions,
            submitted: data.submitted,
            auto: data.auto,
            submitted_at: data.submitted ? new Date() : null,
          },
        },
        { new: true, upsert: true },
      )
      .lean<DecisionDb>()
    this.logger.debug(`[upsert] company ${data.companyId} cycle ${data.cycle} submitted ${data.submitted}`)
    return this.serializer.toCamelCase(decision as DecisionDb)
  }

  async findByCompanyIdAndCycle(companyId: string, cycle: number): Promise<DecisionDbDto | null> {
    const decision = await this.decisionModel.findOne({ company_id: this.serializer.toObjectId(companyId), cycle }).lean<DecisionDb>()
    return decision ? this.serializer.toCamelCase(decision) : null
  }

  async findByGameIdAndCycle(gameId: string, cycle: number): Promise<DecisionDbDto[]> {
    const decisions = await this.decisionModel.find({ game_id: this.serializer.toObjectId(gameId), cycle }).lean<DecisionDb[]>()
    return this.serializer.toCamelCaseArray(decisions)
  }

  async countSubmittedByGameIdAndCycle(gameId: string, cycle: number): Promise<number> {
    return this.decisionModel.countDocuments({ game_id: this.serializer.toObjectId(gameId), cycle, submitted: true, auto: false })
  }
}
