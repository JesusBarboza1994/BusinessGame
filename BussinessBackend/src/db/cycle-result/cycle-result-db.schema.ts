import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, SchemaTypes, Types } from 'mongoose'

import { CompanyDecisions, CompanyState, CycleReport } from '@/modules/simulation/engine/engine.types'
import { MarketResearchReport } from '@/modules/simulation/engine/market-research.engine'

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'cycle_results',
  minimize: false,
})
export class CycleResultDb {
  @Prop({ type: SchemaTypes.ObjectId, auto: true })
  _id: Types.ObjectId

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  game_id: Types.ObjectId

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  company_id: Types.ObjectId

  @Prop({ type: Number, required: true })
  cycle: number

  @Prop({ type: SchemaTypes.Mixed, required: true })
  report: CycleReport

  @Prop({ type: SchemaTypes.Mixed, required: true })
  applied_decisions: CompanyDecisions

  @Prop({ type: Boolean, default: false })
  auto_decisions: boolean

  @Prop({ type: SchemaTypes.Mixed, required: true })
  state_before: CompanyState

  @Prop({ type: SchemaTypes.Mixed, default: null })
  market_research: MarketResearchReport | null

  @Prop({ type: Date, default: Date.now })
  created_at: Date

  @Prop({ type: Date })
  updated_at: Date
}

export const CycleResultSchema = SchemaFactory.createForClass(CycleResultDb)

CycleResultSchema.index({ company_id: 1, cycle: 1 }, { unique: true })
CycleResultSchema.index({ game_id: 1, cycle: 1 })

export type CycleResultDocument = HydratedDocument<CycleResultDb>
