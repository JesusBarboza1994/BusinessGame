import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import { MongooseModule } from '@nestjs/mongoose'
import { ZodValidationPipe } from 'nestjs-zod'

import { AuthModule } from '@/modules/auth/auth.module'
import { GamesModule } from '@/modules/games/games.module'
import { HealthModule } from '@/modules/health/health.module'
import { LiveModule } from '@/modules/live/live.module'
import { PlayModule } from '@/modules/play/play.module'
import { SimulationModule } from '@/modules/simulation/simulation.module'
import { LoggerModule } from '@/providers/logger/logger.module'
import { QueueModule } from '@/queues/queue.module'
import { SettingsModule } from '@/settings/settings.module'

import { AppExceptionFilter } from '@/commons/filters/app-exception.filter'
import { ResponseInterceptor } from '@/commons/serializers/response.serializer'
import { AuthConfig, DatabaseConfig } from '@/settings/settings.model'

@Module({
  imports: [
    SettingsModule,
    LoggerModule,
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<{ database: DatabaseConfig }, true>) => ({ uri: config.get<DatabaseConfig>('database').uri }),
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService<{ auth: AuthConfig }, true>) => {
        const auth = config.get<AuthConfig>('auth')
        return { secret: auth.jwtSecret, signOptions: { expiresIn: auth.jwtExpiresIn as never } }
      },
    }),
    QueueModule,
    HealthModule,
    AuthModule,
    GamesModule,
    PlayModule,
    SimulationModule,
    LiveModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: AppExceptionFilter },
  ],
})
export class AppModule {}
