# Infraestructura sin depender del proveedor

La regla: **el código de negocio depende de una clase abstracta, no de la tecnología.** Si mañana se cambia Redis por otra cosa, solo cambian la implementación y el `useClass` del módulo.

```
service de negocio ──inyecta──▶ CacheService (abstract)
                                      ▲
                     useClass ────────┘
                                      │
                         RedisCacheService (implementación)
```

Se usa una clase abstracta y no una `interface` porque en TypeScript las interfaces desaparecen al compilar y Nest no puede usarlas como token de inyección.

## Cache (`cache/`)

```
cache/
├── cache.service.ts              ← abstract class CacheService
├── cache.module.ts               ← @Global, enlaza la abstracta con la implementación
├── cache.constant.ts             ← prefijos de keys y TTLs
└── redis/
    └── redis-cache.service.ts    ← implementación con Redis
```

```ts
// cache/cache.service.ts
export abstract class CacheService {
  abstract get<T>(key: string): Promise<T | null>
  abstract set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>
  abstract del(key: string | string[]): Promise<void>
  abstract getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttlSeconds: number): Promise<T>
}
```

```ts
// cache/redis/redis-cache.service.ts
@Injectable()
export class RedisCacheService extends CacheService {
  private readonly logger = new Logger(RedisCacheService.name)
  // ...implementa get/set/del/getOrSet sobre el cliente de providers/redis
}
```

```ts
// cache/cache.module.ts
@Global()
@Module({
  providers: [RedisInstanceProvider, { provide: CacheService, useClass: RedisCacheService }],
  exports: [CacheService],
})
export class CacheGlobalModule {}
```

```ts
// uso en un service o guard
constructor(private readonly cacheService: CacheService) {}
```

Prohibido fuera de `cache/redis/` y `providers/redis/`: importar `ioredis`, `BaseRedisService` o `RedisCacheService`.

## Mismo patrón para otros proveedores

| Abstracta (lo que se inyecta) | Implementación actual | Ubicación |
|---|---|---|
| `CacheService` | `RedisCacheService` | `cache/` |
| `NotificationService` | `NotificationSnsService` | `providers/notification/` |
| `StorageService` | `S3StorageService` | `providers/storage/` |

La estructura siempre es `<x>.service.ts` (la abstracta), `<proveedor>/<proveedor>-<x>.service.ts` (la implementación) y `<x>.module.ts` (el binding).

## Logger (`providers/logger/logger.module.ts`)

- `nestjs-pino` con transporte `pino-loki` cuando existe `LOKI_URL`. Los logs van a Loki y se ven en Grafana.
- En `app.ts`: `NestFactory.create(AppModule, { bufferLogs: true })` y luego `app.useLogger(app.get(Logger))`.
- En las clases se usa `new Logger(Clase.name)` de `@nestjs/common`. Nunca `console.*` ni instancias de pino directas.
- Niveles: `error` para fallos, `warn` para casos esperados pero anómalos, `log` para hitos y `debug` para payloads.
- Nunca se loguean tokens, api keys ni datos personales completos.

## Settings (`settings/`)

- `settings.model.ts`: interfaces tipadas por dominio (`DatabaseConfig`, `CacheConfig`, `AuthConfig`...).
- `settings.configuration.ts`: mapea `process.env` a esas interfaces.
- `settings.module.ts`: `ConfigModule.forRoot({ isGlobal: true, load: [configuration] })`.
