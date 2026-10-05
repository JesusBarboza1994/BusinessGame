import { Module } from '@nestjs/common'

import { FacilitatorDbModule } from '@/db/facilitator/facilitator-db.module'

import { AuthController } from './controllers/auth.controller'
import { AuthService } from './services/auth.service'

@Module({
  imports: [FacilitatorDbModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
