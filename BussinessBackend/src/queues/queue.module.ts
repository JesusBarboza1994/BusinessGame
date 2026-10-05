import { BullModule } from '@nestjs/bullmq'
import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { RedisConfig } from '@/settings/settings.model'

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<{ redis: RedisConfig }, true>) => {
        const redis = config.get<RedisConfig>('redis')
        return {
          connection: {
            host: redis.host,
            port: redis.port,
            username: redis.username,
            password: redis.password,
            family: redis.family,
            tls: redis.tls ? {} : undefined,
          },
        }
      },
    }),
  ],
})
export class QueueModule {}
