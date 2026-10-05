import 'reflect-metadata'

import { ConfigService } from '@nestjs/config'

import { createApp } from './app'

import { AppConfig } from '@/settings/settings.model'

async function bootstrap(): Promise<void> {
  const app = await createApp()
  const { port } = app.get(ConfigService).get<AppConfig>('app') as AppConfig
  await app.listen(port)
}

void bootstrap()
