# Providers (`providers/<nombre>/`)

Aquí va todo lo que sale del servicio: otros microservicios mms-*, APIs de terceros e infraestructura (logger, redis, s3, sns). Para la infraestructura, ver además [infra.md](infra.md).

```
providers/
├── auth/
│   └── auth-api.service.ts             ← cliente HTTP de mms-authentication
├── ai/
│   ├── ai-api.service.ts
│   └── dto/
│       └── run-ai-task-request.dto.ts
├── channels/channels-api.service.ts
├── logger/logger.module.ts
└── notification/ ...                    ← ver infra.md
```

## Cliente de otro microservicio

- Archivo `<nombre>-api.service.ts`, clase `<Nombre>ApiService`.
- Usa `HttpService` de `commons/services/http.service.ts` y lee la URL y la api key de `ConfigService` tipado con la interfaz de `settings/settings.model.ts`.
- Los dto de request y response del servicio externo van en `providers/<nombre>/dto/`.
- Loguea y relanza como exception propia (`commons/exceptions/<nombre>/`).

```ts
@Injectable()
export class AuthApiService {
  private readonly logger = new Logger(AuthApiService.name)
  private readonly authUrl: string

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<{ auth: AuthConfig }, true>,
  ) {
    this.authUrl = this.configService.get<AuthConfig>('auth')?.url
  }

  async getStore(storeId: string, { token, apiKey }: AuthenticatedApiDto): Promise<StoreDetailsDto> {
    const url = `${this.authUrl}/v1/store/${storeId}`
    // ...
  }
}
```

## Nueva configuración

Para agregar una variable de entorno:
1. Agrega la interfaz en `settings/settings.model.ts` (`export interface XConfig { url: string; apiKey: string }`).
2. Mapea el valor en `settings/settings.configuration.ts`.
3. Léela con `ConfigService<{ x: XConfig }, true>`. Nunca uses `process.env` fuera de `settings/` y de `providers/logger/`.
