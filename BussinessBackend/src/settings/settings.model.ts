export interface AppConfig {
  port: number
  corsOrigin: string[]
}

export interface DatabaseConfig {
  uri: string
}

export interface RedisConfig {
  host: string
  port: number
  username?: string
  password?: string
  tls: boolean
  family: number
}

export interface AuthConfig {
  jwtSecret: string
  jwtExpiresIn: string
  playerTokenTtlHours: number
}

export interface LoggerConfig {
  level: string
  lokiUrl?: string
}

export interface Settings {
  app: AppConfig
  database: DatabaseConfig
  redis: RedisConfig
  auth: AuthConfig
  logger: LoggerConfig
}
