import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, Logger } from '@nestjs/common'
import { JobsOptions, Queue } from 'bullmq'

import { CycleCloseReason } from '@/commons/constants/game.constant'
import { CYCLE_QUEUE, CycleJobName } from '../queues.constant'
import { CycleCloseJobDto } from '../shared/cycle-close-job.dto'

@Injectable()
export class CycleProducer {
  private readonly logger = new Logger(CycleProducer.name)

  private readonly jobOptions: JobsOptions = {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true,
    removeOnFail: { count: 50 },
  }

  constructor(@InjectQueue(CYCLE_QUEUE) private readonly queue: Queue) {}

  // Delayed job that fires when the cycle time runs out; the job id dedupes reschedules
  async scheduleDeadline(gameId: string, cycle: number, deadline: Date): Promise<void> {
    const data: CycleCloseJobDto = { gameId, cycle, reason: CycleCloseReason.DEADLINE }
    const delay = Math.max(0, deadline.getTime() - Date.now())
    await this.queue.add(CycleJobName.CLOSE, data, { ...this.jobOptions, delay, jobId: `deadline-${gameId}-${cycle}` })
    this.logger.log(`[scheduleDeadline] game ${gameId} cycle ${cycle} in ${Math.round(delay / 1000)}s`)
  }

  async closeNow(gameId: string, cycle: number, reason: CycleCloseReason): Promise<void> {
    const data: CycleCloseJobDto = { gameId, cycle, reason }
    await this.queue.add(CycleJobName.CLOSE, data, { ...this.jobOptions, jobId: `now-${gameId}-${cycle}` })
    this.logger.log(`[closeNow] game ${gameId} cycle ${cycle} reason ${reason}`)
  }
}
