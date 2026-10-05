import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { isValidObjectId, Model } from 'mongoose'

import { GameDbSerializer } from './game-db.serializer'

import { CycleStatus } from '@/commons/constants/game.constant'
import { GameDb } from './game-db.schema'
import { CreateGameDbDto, GameDbDto, UpdateGameDbDto } from './game-db.dto'

@Injectable()
export class GameDbRepository {
  private readonly logger = new Logger(GameDbRepository.name)

  constructor(
    @InjectModel(GameDb.name) private readonly gameModel: Model<GameDb>,
    private readonly serializer: GameDbSerializer,
  ) {}

  async create(data: CreateGameDbDto): Promise<GameDbDto> {
    const created = await this.gameModel.create({
      facilitator_id: this.serializer.toObjectId(data.facilitatorId),
      name: data.name,
      pin: data.pin,
      settings: data.settings,
      cycle_duration_minutes: data.cycleDurationMinutes,
    })
    this.logger.log(`[create] game ${created._id.toString()} pin ${data.pin}`)
    return this.serializer.toCamelCase(created.toObject())
  }

  async findById(id: string): Promise<GameDbDto | null> {
    if (!isValidObjectId(id)) return null
    const game = await this.gameModel.findById(id).lean<GameDb>()
    return game ? this.serializer.toCamelCase(game) : null
  }

  async findByPin(pin: string): Promise<GameDbDto | null> {
    const game = await this.gameModel.findOne({ pin }).lean<GameDb>()
    return game ? this.serializer.toCamelCase(game) : null
  }

  async existsByPin(pin: string): Promise<boolean> {
    return (await this.gameModel.exists({ pin })) !== null
  }

  async findByFacilitatorId(facilitatorId: string): Promise<GameDbDto[]> {
    const games = await this.gameModel
      .find({ facilitator_id: this.serializer.toObjectId(facilitatorId) })
      .sort({ created_at: -1 })
      .select({ economy: 0 })
      .lean<GameDb[]>()
    return this.serializer.toCamelCaseArray(games)
  }

  async updateById(id: string, data: UpdateGameDbDto): Promise<GameDbDto | null> {
    const game = await this.gameModel
      .findByIdAndUpdate(id, { $set: this.serializer.toSnakeCaseUpdate(data) }, { new: true })
      .lean<GameDb>()
    return game ? this.serializer.toCamelCase(game) : null
  }

  // Atomic compare-and-set so only one worker processes a given cycle
  async updateCycleStatus(id: string, cycle: number, from: CycleStatus, to: CycleStatus): Promise<GameDbDto | null> {
    const game = await this.gameModel
      .findOneAndUpdate({ _id: id, current_cycle: cycle, cycle_status: from }, { $set: { cycle_status: to } }, { new: true })
      .lean<GameDb>()
    return game ? this.serializer.toCamelCase(game) : null
  }
}
