import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { CycleResultDbRepository } from './cycle-result-db.repository'
import { CycleResultDbSerializer } from './cycle-result-db.serializer'

import { CycleResultDb, CycleResultSchema } from './cycle-result-db.schema'

@Module({
  imports: [MongooseModule.forFeature([{ name: CycleResultDb.name, schema: CycleResultSchema }])],
  providers: [CycleResultDbRepository, CycleResultDbSerializer],
  exports: [CycleResultDbRepository, CycleResultDbSerializer],
})
export class CycleResultDbModule {}
