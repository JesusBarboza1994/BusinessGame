import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, SchemaTypes, Types } from 'mongoose'

import { BotProfile, CompanyState, CompanyStatus, ValuationMethod } from '@/modules/simulation/engine/engine.types'

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'companies',
  minimize: false,
})
export class CompanyDb {
  @Prop({ type: SchemaTypes.ObjectId, auto: true })
  _id: Types.ObjectId

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  game_id: Types.ObjectId

  @Prop({ type: String, required: true, trim: true })
  name: string

  @Prop({ type: String, required: true })
  name_key: string

  @Prop({ type: String, required: true })
  avatar: string

  @Prop({ type: String, required: true })
  color: string

  @Prop({ type: String, required: true })
  player_token_hash: string

  @Prop({ type: Date, required: true })
  token_expires_at: Date

  @Prop({ type: String, enum: ValuationMethod, required: true })
  valuation_method: ValuationMethod

  @Prop({ type: String, enum: CompanyStatus, default: CompanyStatus.ACTIVE })
  status: CompanyStatus

  @Prop({ type: SchemaTypes.Mixed, required: true })
  state: CompanyState

  @Prop({ type: Boolean, default: false })
  is_bot: boolean

  @Prop({ type: SchemaTypes.Mixed, default: null })
  bot_profile: BotProfile | null

  @Prop({ type: Date, default: Date.now })
  created_at: Date

  @Prop({ type: Date })
  updated_at: Date
}

export const CompanySchema = SchemaFactory.createForClass(CompanyDb)

CompanySchema.index({ game_id: 1, name_key: 1 }, { unique: true })
CompanySchema.index({ player_token_hash: 1 }, { unique: true })

export type CompanyDocument = HydratedDocument<CompanyDb>
