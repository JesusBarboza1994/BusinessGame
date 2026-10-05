import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, SchemaTypes, Types } from 'mongoose'

import { CompanyDecisions } from '@/modules/simulation/engine/engine.types'

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'decisions',
  minimize: false,
})
export class DecisionDb {
  @Prop({ type: SchemaTypes.ObjectId, auto: true })
  _id: Types.ObjectId

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  game_id: Types.ObjectId

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  company_id: Types.ObjectId

  @Prop({ type: Number, required: true })
  cycle: number

  @Prop({ type: SchemaTypes.Mixed, required: true })
  decisions: CompanyDecisions

  @Prop({ type: Boolean, default: false })
  submitted: boolean

  @Prop({ type: Boolean, default: false })
  auto: boolean

  @Prop({ type: Date, default: null })
  submitted_at: Date | null

  @Prop({ type: Date, default: Date.now })
  created_at: Date

  @Prop({ type: Date })
  updated_at: Date
}

export const DecisionSchema = SchemaFactory.createForClass(DecisionDb)

DecisionSchema.index({ company_id: 1, cycle: 1 }, { unique: true })
DecisionSchema.index({ game_id: 1, cycle: 1, submitted: 1 })

export type DecisionDocument = HydratedDocument<DecisionDb>
