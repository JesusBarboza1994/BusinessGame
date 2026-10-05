import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { GameDbRepository } from './game-db.repository'
import { GameDbSerializer } from './game-db.serializer'

import { GameDb, GameSchema } from './game-db.schema'

@Module({
  imports: [MongooseModule.forFeature([{ name: GameDb.name, schema: GameSchema }])],
  providers: [GameDbRepository, GameDbSerializer],
  exports: [GameDbRepository, GameDbSerializer],
})
export class GameDbModule {}
