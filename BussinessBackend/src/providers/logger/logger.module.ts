import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino'

import { SENSITIVE_LOG_PATHS } from '@/commons/constants/logger.constant'
import { LoggerConfig } from '@/settings/settings.model'

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<{ logger: LoggerConfig }, true>) => {
        const { level, lokiUrl } = config.get<LoggerConfig>('logger')
        const isDev = process.env.NODE_ENV !== 'production'
        return {
          pinoHttp: {
            level,
            redact: SENSITIVE_LOG_PATHS,
            autoLogging: { ignore: (req) => req.url?.includes('/health') ?? false },
            transport: lokiUrl
              ? { target: 'pino-loki', options: { host: lokiUrl, labels: { app: 'bussiness-backend' } } }
              : isDev
                ? { target: 'pino-pretty', options: { singleLine: true, colorize: true } }
                : undefined,
          },
        }
      },
    }),
  ],
})
export class LoggerModule {}
