import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { isValidObjectId, Model } from 'mongoose'

import { CompanyDbSerializer } from './company-db.serializer'

import { CompanyState, CompanyStatus } from '@/modules/simulation/engine/engine.types'
import { CompanyDb } from './company-db.schema'
import { CompanyDbDto, CreateCompanyDbDto } from './company-db.dto'

@Injectable()
export class CompanyDbRepository {
  private readonly logger = new Logger(CompanyDbRepository.name)

  constructor(
    @InjectModel(CompanyDb.name) private readonly companyModel: Model<CompanyDb>,
    private readonly serializer: CompanyDbSerializer,
  ) {}

  async create(data: CreateCompanyDbDto): Promise<CompanyDbDto> {
    const created = await this.companyModel.create({
      game_id: this.serializer.toObjectId(data.gameId),
      name: data.name.trim(),
      name_key: this.serializer.toNameKey(data.name),
      avatar: data.avatar,
      color: data.color,
      player_token_hash: data.playerTokenHash,
      token_expires_at: data.tokenExpiresAt,
      valuation_method: data.valuationMethod,
      state: data.state,
      is_bot: Boolean(data.botProfile),
      bot_profile: data.botProfile ?? null,
    })
    this.logger.log(`[create] company ${created._id.toString()} game ${data.gameId}`)
    return this.serializer.toCamelCase(created.toObject())
  }

  async findById(id: string): Promise<CompanyDbDto | null> {
    if (!isValidObjectId(id)) return null
    const company = await this.companyModel.findById(id).lean<CompanyDb>()
    return company ? this.serializer.toCamelCase(company) : null
  }

  async findByTokenHash(tokenHash: string): Promise<CompanyDbDto | null> {
    const company = await this.companyModel.findOne({ player_token_hash: tokenHash }).lean<CompanyDb>()
    return company ? this.serializer.toCamelCase(company) : null
  }

  async findByGameId(gameId: string): Promise<CompanyDbDto[]> {
    const companies = await this.companyModel
      .find({ game_id: this.serializer.toObjectId(gameId) })
      .sort({ created_at: 1 })
      .lean<CompanyDb[]>()
    return this.serializer.toCamelCaseArray(companies)
  }

  async countByGameId(gameId: string): Promise<number> {
    return this.companyModel.countDocuments({ game_id: this.serializer.toObjectId(gameId) })
  }

  async existsByGameIdAndName(gameId: string, name: string): Promise<boolean> {
    const found = await this.companyModel.exists({ game_id: this.serializer.toObjectId(gameId), name_key: this.serializer.toNameKey(name) })
    return found !== null
  }

  async updateState(id: string, state: CompanyState, status: CompanyStatus): Promise<void> {
    await this.companyModel.updateOne({ _id: id }, { $set: { state, status } })
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.companyModel.deleteOne({ _id: id })
    return result.deletedCount > 0
  }
}
