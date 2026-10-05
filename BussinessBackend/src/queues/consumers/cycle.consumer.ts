import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'

import { SimulationService } from '@/modules/simulation/services/simulation.service'

import { isLastAttempt } from '../queue.utils'
import { CYCLE_QUEUE } from '../queues.constant'
import { CycleCloseJobDto } from '../shared/cycle-close-job.dto'

@Processor(CYCLE_QUEUE)
export class CycleConsumer extends WorkerHost {
  private readonly logger = new Logger(CycleConsumer.name)

  constructor(private readonly simulationService: SimulationService) {
    super()
  }

  async process(job: Job<CycleCloseJobDto>): Promise<void> {
    const { gameId, cycle, reason } = job.data
    try {
      this.logger.log(`[process] close game ${gameId} cycle ${cycle} (${reason})`)
      await this.simulationService.closeCycle(gameId, cycle, reason)
    } catch (error) {
      this.logger.error(`[process] attempt ${job.attemptsMade + 1}: ${(error as Error).message}`)
      if (isLastAttempt(job)) await this.simulationService.releaseCycle(gameId, cycle)
      throw error
    }
  }
}
