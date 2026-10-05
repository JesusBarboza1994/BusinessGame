import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { isValidObjectId, Model } from 'mongoose'

import { FacilitatorDbSerializer } from './facilitator-db.serializer'

import { FacilitatorDb } from './facilitator-db.schema'
import { CreateFacilitatorDbDto, FacilitatorDbDto } from './facilitator-db.dto'

@Injectable()
export class FacilitatorDbRepository {
  private readonly logger = new Logger(FacilitatorDbRepository.name)

  constructor(
    @InjectModel(FacilitatorDb.name) private readonly facilitatorModel: Model<FacilitatorDb>,
    private readonly serializer: FacilitatorDbSerializer,
  ) {}

  async create(data: CreateFacilitatorDbDto): Promise<FacilitatorDbDto> {
    const created = await this.facilitatorModel.create({ name: data.name, email: data.email, password_hash: data.passwordHash })
    this.logger.log(`[create] facilitator ${created._id.toString()}`)
    return this.serializer.toCamelCase(created.toObject())
  }

  async findById(id: string): Promise<FacilitatorDbDto | null> {
    if (!isValidObjectId(id)) return null
    const facilitator = await this.facilitatorModel.findById(id).lean<FacilitatorDb>()
    return facilitator ? this.serializer.toCamelCase(facilitator) : null
  }

  async findByEmail(email: string): Promise<FacilitatorDbDto | null> {
    const facilitator = await this.facilitatorModel.findOne({ email: email.toLowerCase().trim() }).lean<FacilitatorDb>()
    return facilitator ? this.serializer.toCamelCase(facilitator) : null
  }
}
