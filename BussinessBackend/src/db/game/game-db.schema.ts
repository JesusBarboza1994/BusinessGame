import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, SchemaTypes, Types } from 'mongoose'

import { CycleStatus, GameStatus } from '@/commons/constants/game.constant'

import { EconomySeries, GameSettings, MarketState, RankingEntry } from '@/modules/simulation/engine/engine.types'

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'games',
  minimize: false,
})
export class GameDb {
  @Prop({ type: SchemaTypes.ObjectId, auto: true })
  _id: Types.ObjectId

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  facilitator_id: Types.ObjectId

  @Prop({ type: String, required: true, trim: true })
  name: string

  @Prop({ type: String, required: true })
  pin: string

  @Prop({ type: String, enum: GameStatus, default: GameStatus.LOBBY })
  status: GameStatus

  @Prop({ type: SchemaTypes.Mixed, required: true })
  settings: GameSettings

  @Prop({ type: Number, required: true })
  cycle_duration_minutes: number

  @Prop({ type: Number, default: 0 })
  current_cycle: number

  @Prop({ type: String, enum: CycleStatus, default: CycleStatus.CLOSED })
  cycle_status: CycleStatus

  @Prop({ type: Date, default: null })
  cycle_deadline: Date | null

  @Prop({ type: SchemaTypes.Mixed, default: null })
  economy: EconomySeries | null

  @Prop({ type: SchemaTypes.Mixed, default: null })
  market_state: MarketState | null

  @Prop({ type: SchemaTypes.Mixed, default: [] })
  ranking: RankingEntry[]

  @Prop({ type: Date, default: null })
  started_at: Date | null

  @Prop({ type: Date, default: null })
  finished_at: Date | null

  @Prop({ type: Date, default: Date.now })
  created_at: Date

  @Prop({ type: Date })
  updated_at: Date
}

export const GameSchema = SchemaFactory.createForClass(GameDb)

GameSchema.index({ pin: 1 }, { unique: true })
GameSchema.index({ facilitator_id: 1, created_at: -1 })

export type GameDocument = HydratedDocument<GameDb>
