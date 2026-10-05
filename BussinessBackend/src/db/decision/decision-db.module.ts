import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { DecisionDbRepository } from './decision-db.repository'
import { DecisionDbSerializer } from './decision-db.serializer'

import { DecisionDb, DecisionSchema } from './decision-db.schema'

@Module({
  imports: [MongooseModule.forFeature([{ name: DecisionDb.name, schema: DecisionSchema }])],
  providers: [DecisionDbRepository, DecisionDbSerializer],
  exports: [DecisionDbRepository, DecisionDbSerializer],
})
export class DecisionDbModule {}
