import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, SchemaTypes, Types } from 'mongoose'

import { MarketCycleResult, RankingEntry } from '@/modules/simulation/engine/engine.types'

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'market_results',
  minimize: false,
})
export class MarketResultDb {
  @Prop({ type: SchemaTypes.ObjectId, auto: true })
  _id: Types.ObjectId

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  game_id: Types.ObjectId

  @Prop({ type: Number, required: true })
  cycle: number

  @Prop({ type: SchemaTypes.Mixed, required: true })
  result: MarketCycleResult

  @Prop({ type: SchemaTypes.Mixed, required: true })
  ranking: RankingEntry[]

  @Prop({ type: Date, default: Date.now })
  created_at: Date

  @Prop({ type: Date })
  updated_at: Date
}

export const MarketResultSchema = SchemaFactory.createForClass(MarketResultDb)

MarketResultSchema.index({ game_id: 1, cycle: 1 }, { unique: true })

export type MarketResultDocument = HydratedDocument<MarketResultDb>
