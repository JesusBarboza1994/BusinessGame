import { Module } from '@nestjs/common'

import { CompanyDbModule } from '@/db/company/company-db.module'
import { CycleResultDbModule } from '@/db/cycle-result/cycle-result-db.module'
import { DecisionDbModule } from '@/db/decision/decision-db.module'
import { GameDbModule } from '@/db/game/game-db.module'
import { MarketResultDbModule } from '@/db/market-result/market-result-db.module'
import { LiveModule } from '@/modules/live/live.module'
import { CycleConsumer } from '@/queues/consumers/cycle.consumer'
import { CycleProducerModule } from '@/queues/producers/cycle-producer.module'

import { SimulationService } from './services/simulation.service'

@Module({
  imports: [GameDbModule, CompanyDbModule, DecisionDbModule, CycleResultDbModule, MarketResultDbModule, CycleProducerModule, LiveModule],
  providers: [SimulationService, CycleConsumer],
  exports: [SimulationService],
})
export class SimulationModule {}
