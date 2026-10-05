import { Module } from '@nestjs/common'

import { CompanyDbModule } from '@/db/company/company-db.module'
import { CycleResultDbModule } from '@/db/cycle-result/cycle-result-db.module'
import { DecisionDbModule } from '@/db/decision/decision-db.module'
import { GameDbModule } from '@/db/game/game-db.module'
import { MarketResultDbModule } from '@/db/market-result/market-result-db.module'
import { LiveModule } from '@/modules/live/live.module'
import { SimulationModule } from '@/modules/simulation/simulation.module'

import { PlayController } from './controllers/play.controller'
import { PlayService } from './services/play.service'

@Module({
  imports: [GameDbModule, CompanyDbModule, DecisionDbModule, CycleResultDbModule, MarketResultDbModule, SimulationModule, LiveModule],
  controllers: [PlayController],
  providers: [PlayService],
})
export class PlayModule {}
