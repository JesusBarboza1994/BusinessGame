import { Injectable } from '@nestjs/common'
import { Types } from 'mongoose'

import { FacilitatorDb } from './facilitator-db.schema'

import { FacilitatorDbDto } from './facilitator-db.dto'

@Injectable()
export class FacilitatorDbSerializer {
  toCamelCase(facilitator: FacilitatorDb): FacilitatorDbDto {
    return {
      id: facilitator._id.toString(),
      name: facilitator.name,
      email: facilitator.email,
      passwordHash: facilitator.password_hash,
      createdAt: facilitator.created_at,
    }
  }

  toObjectId(id: string): Types.ObjectId {
    return new Types.ObjectId(id)
  }
}
