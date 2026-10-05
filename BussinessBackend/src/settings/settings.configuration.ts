import { RedisConfig, Settings } from './settings.model'

// REDIS_URL (what Railway and most hosts provide) wins over the discrete REDIS_* variables
const redisConfig = (): RedisConfig => {
  // 0 lets ioredis resolve IPv4 and IPv6; Railway's private network is IPv6-only
  const family = Number(process.env.REDIS_FAMILY ?? 0)
  if (process.env.REDIS_URL) {
    const url = new URL(process.env.REDIS_URL)
    return {
      host: url.hostname,
      port: Number(url.port || 6379),
      username: url.username ? decodeURIComponent(url.username) : undefined,
      password: url.password ? decodeURIComponent(url.password) : undefined,
      tls: url.protocol === 'rediss:',
      family,
    }
  }
  return {
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: Number(process.env.REDIS_PORT ?? 6379),
    username: process.env.REDIS_USERNAME || undefined,
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_TLS === 'true',
    family,
  }
}

export default (): Settings => ({
  app: {
    port: Number(process.env.PORT ?? 4000),
    corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:5174').split(',').map((origin) => origin.trim().replace(/\/$/, '')).filter(Boolean),
  },
  database: {
    uri: process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/business-simulator',
  },
  redis: redisConfig(),
  auth: {
    jwtSecret: process.env.JWT_SECRET ?? 'dev-secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '12h',
    playerTokenTtlHours: Number(process.env.PLAYER_TOKEN_TTL_HOURS ?? 48),
  },
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
    lokiUrl: process.env.LOKI_URL || undefined,
  },
})
