import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, SchemaTypes, Types } from 'mongoose'

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'facilitators',
})
export class FacilitatorDb {
  @Prop({ type: SchemaTypes.ObjectId, auto: true })
  _id: Types.ObjectId

  @Prop({ type: String, required: true, trim: true })
  name: string

  @Prop({ type: String, required: true, lowercase: true, trim: true })
  email: string

  @Prop({ type: String, required: true })
  password_hash: string

  @Prop({ type: Date, default: Date.now })
  created_at: Date

  @Prop({ type: Date })
  updated_at: Date
}

export const FacilitatorSchema = SchemaFactory.createForClass(FacilitatorDb)

FacilitatorSchema.index({ email: 1 }, { unique: true })

export type FacilitatorDocument = HydratedDocument<FacilitatorDb>
