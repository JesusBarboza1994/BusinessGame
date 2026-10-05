import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'

import { CycleProducer } from './cycle.producer'

import { CYCLE_QUEUE } from '../queues.constant'

@Module({
  imports: [BullModule.registerQueue({ name: CYCLE_QUEUE, streams: { events: { maxLen: 1000 } } })],
  providers: [CycleProducer],
  exports: [CycleProducer, BullModule],
})
export class CycleProducerModule {}
