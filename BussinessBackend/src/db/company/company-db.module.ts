import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { CompanyDbRepository } from './company-db.repository'
import { CompanyDbSerializer } from './company-db.serializer'

import { CompanyDb, CompanySchema } from './company-db.schema'

@Module({
  imports: [MongooseModule.forFeature([{ name: CompanyDb.name, schema: CompanySchema }])],
  providers: [CompanyDbRepository, CompanyDbSerializer],
  exports: [CompanyDbRepository, CompanyDbSerializer],
})
export class CompanyDbModule {}
