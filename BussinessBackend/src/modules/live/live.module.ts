import { Module } from '@nestjs/common'

import { LiveGateway } from './gateway/live.gateway'

@Module({
  providers: [LiveGateway],
  exports: [LiveGateway],
})
export class LiveModule {}
