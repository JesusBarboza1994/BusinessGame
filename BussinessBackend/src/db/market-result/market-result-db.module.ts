import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { MarketResultDbRepository } from './market-result-db.repository'
import { MarketResultDbSerializer } from './market-result-db.serializer'

import { MarketResultDb, MarketResultSchema } from './market-result-db.schema'

@Module({
  imports: [MongooseModule.forFeature([{ name: MarketResultDb.name, schema: MarketResultSchema }])],
  providers: [MarketResultDbRepository, MarketResultDbSerializer],
  exports: [MarketResultDbRepository, MarketResultDbSerializer],
})
export class MarketResultDbModule {}
