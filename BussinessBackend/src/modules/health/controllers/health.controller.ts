import { Controller, Get } from '@nestjs/common'

import { ResponseMessage } from '@/commons/decorators/response-message.decorator'

@Controller({ path: 'health', version: '1' })
export class HealthController {
  @Get()
  @ResponseMessage('HEALTH_OK', 'Service is healthy')
  check(): { status: string; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() }
  }
}
