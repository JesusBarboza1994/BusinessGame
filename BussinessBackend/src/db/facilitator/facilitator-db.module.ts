import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { FacilitatorDbRepository } from './facilitator-db.repository'
import { FacilitatorDbSerializer } from './facilitator-db.serializer'

import { FacilitatorDb, FacilitatorSchema } from './facilitator-db.schema'

@Module({
  imports: [MongooseModule.forFeature([{ name: FacilitatorDb.name, schema: FacilitatorSchema }])],
  providers: [FacilitatorDbRepository, FacilitatorDbSerializer],
  exports: [FacilitatorDbRepository, FacilitatorDbSerializer],
})
export class FacilitatorDbModule {}
