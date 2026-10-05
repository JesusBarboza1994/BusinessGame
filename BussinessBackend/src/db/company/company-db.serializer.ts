import { Injectable } from '@nestjs/common'
import { Types } from 'mongoose'

import { CompanyDb } from './company-db.schema'

import { CompanyDbDto } from './company-db.dto'

@Injectable()
export class CompanyDbSerializer {
  toCamelCase(company: CompanyDb): CompanyDbDto {
    return {
      id: company._id.toString(),
      gameId: company.game_id.toString(),
      name: company.name,
      avatar: company.avatar,
      color: company.color,
      tokenExpiresAt: company.token_expires_at,
      valuationMethod: company.valuation_method,
      status: company.status,
      state: company.state,
      isBot: company.is_bot ?? false,
      botProfile: company.bot_profile ?? null,
      createdAt: company.created_at,
    }
  }

  toCamelCaseArray(companies: CompanyDb[]): CompanyDbDto[] {
    return companies.map((company) => this.toCamelCase(company))
  }

  toNameKey(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, ' ')
  }

  toObjectId(id: string): Types.ObjectId {
    return new Types.ObjectId(id)
  }
}
