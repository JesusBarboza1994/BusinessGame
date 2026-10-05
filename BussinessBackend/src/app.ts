import { INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { Logger } from 'nestjs-pino'

import { AppModule } from './app.module'

import { VERSIONING_OPTIONS } from '@/commons/constants/versioning.constant'
import { AppConfig } from '@/settings/settings.model'

export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  app.useLogger(app.get(Logger))
  const config = app.get(ConfigService)
  const { corsOrigin } = config.get<AppConfig>('app') as AppConfig
  app.enableCors({ origin: corsOrigin, credentials: true })
  app.enableVersioning(VERSIONING_OPTIONS)
  app.enableShutdownHooks()
  return app
}
