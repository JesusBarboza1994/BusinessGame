# Commons (`commons/`)

Solo va aquí lo que usan **dos o más** módulos. Si algo lo usa un único módulo, se queda dentro de ese módulo.

```
commons/
├── constants/     <dominio>.constant.ts (enums y constantes) · versioning.constant.ts · logger.constant.ts
├── decorators/    authenticated · api-key · response-message · rate-limit
├── dto/           dtos compartidos (authenticate.dto.ts, store.dto.ts, user.dto.ts)
├── exceptions/    ver exceptions.md
├── gateways/      base-gateway.ts
├── guards/        authenticated · api-key · combined-auth · public-api-key · rate-limit
├── helpers/       <x>.helper.ts (funciones puras de dominio)
├── pipes/         <x>.pipe.ts
├── serializers/   response.serializer.ts (ResponseInterceptor global)
├── services/      http.service.ts · timezone.service.ts · excel.service.ts
├── types/         <x>.types.ts (response.types.ts...)
├── utils/         <x>.util.ts (utilidades genéricas sin dominio)
└── validations/   schemas zod compartidos
```

## Qué guard usar

| Guard | Header(s) | Cuándo |
|---|---|---|
| `AuthenticatedGuard` | `Authorization: Bearer <token>` + `store-id` | Endpoints que llama el dashboard con un usuario logueado. Se usa con `@Authenticated()` para obtener `{ user, token }` |
| `ApiKeyGuard` | `x-api-key` | Llamadas entre microservicios o desde lambdas |
| `CombinedAuthGuard` | `x-api-key` **o** token + `store-id` | Endpoints que consumen tanto el dashboard como otros servicios |
| `PublicApiKeyGuard` | `public-api-key` | Endpoints públicos (landing, QR, widgets) con una key fija por config |
| `RateLimitGuard` + `@RateLimit()` | `submit-id` | Siempre **combinado** con uno de los anteriores, nunca solo |

Todo endpoint tiene al menos uno de los cuatro primeros. Las excepciones son `health` y los gateways.

## Decorators de controller

- `@ResponseMessage('CODE', 'message')`: obligatorio en cada handler, alimenta el `ResponseInterceptor`.
- `@Authenticated()`: devuelve la sesión (`AuthenticatedSessionDto`). Solo funciona con `AuthenticatedGuard` o `CombinedAuthGuard`.

## Constantes

- Un archivo por dominio: `commons/constants/<dominio>.constant.ts`.
- Los enums en PascalCase, con valores en SCREAMING_SNAKE o kebab según el contrato existente.
- Las constantes de colas **no** van aquí, van en `queues/queues.constant.ts`.
