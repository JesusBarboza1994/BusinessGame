---
name: mms-nest-structure
description: Convenciones de estructura de carpetas, nombres de archivos y reglas obligatorias para los microservicios NestJS mms-* (mms-authentication, mms-channels, mms-custom-stores, mms-data, mms-payments, mms-restaurants, mms-ai). Úsala SIEMPRE que vayas a crear o modificar un módulo, controller, service, endpoint, dto, validación, schema/repositorio de Mongo, exception, provider externo, cola BullMQ (producer/consumer), gateway WebSocket, cache o test en cualquiera de esos servicios, aunque el pedido sea pequeño ("agrega un endpoint", "crea la colección X", "encola esto"). No aplica a clemente-socket ni a mms-mrc-fidelization.
---

# Estructura de los servicios NestJS mms-*

Antes de crear un archivo, ubica la capa en la tabla "¿Dónde va?" y lee **solo** la referencia de esa capa.

## Estructura raíz de `src/`

```
src/
├── main.ts · app.ts · app.module.ts
├── settings/     settings.configuration.ts · settings.model.ts · settings.module.ts
├── modules/      una carpeta por feature + health/
├── db/           una carpeta por colección Mongo (<entity>-db.*)
├── providers/    clientes de otros microservicios / APIs externas / SDKs (logger, s3, sns, redis)
├── queues/       producers/ · consumers/ · queues.constant.ts · queue.utils.ts · shared/
├── cache/        abstracción de cache agnóstica al proveedor
├── crons/        tareas programadas (si aplica)
├── commons/      constants · decorators · dto · exceptions · gateways · guards · helpers
│                 pipes · serializers · services · types · utils · validations
└── types/        express.d.ts · vitest.d.ts
```

## ¿Dónde va?

| Quiero... | Ubicación | Referencia |
|---|---|---|
| Nuevo endpoint / feature | `modules/<feature>/` | [module.md](references/module.md) |
| Nueva colección Mongo | `db/<entity>/` | [db.md](references/db.md) |
| Nuevo error de negocio | `commons/exceptions/<dominio>/` | [exceptions.md](references/exceptions.md) |
| Llamar a otro microservicio / API externa | `providers/<nombre>/` | [providers.md](references/providers.md) |
| Procesar algo en background | `queues/` | [queues.md](references/queues.md) |
| Cache, logger, settings, storage, notificaciones | `cache/`, `providers/`, `settings/` | [infra.md](references/infra.md) |
| Emitir eventos en tiempo real al dashboard | `modules/<feature>/gateway/` | [module.md](references/module.md) |
| Guards, decorators, constantes, helpers compartidos | `commons/` | [commons.md](references/commons.md) |
| Tests y mocks | junto al archivo + `mocks/` | [testing.md](references/testing.md) |

## Reglas obligatorias

1. **Versioning de Nest en todos los controllers.** Se usa `@Controller({ path: 'amenity', version: '1' })`, nunca `@Controller('amenity')`. En `app.ts` va `app.enableVersioning(VERSIONING_OPTIONS)`, con la constante en `commons/constants/versioning.constant.ts` (`VersioningType.URI`, `defaultVersion: '1'`). Si el servicio todavía usa `app.setGlobalPrefix('v1')`, al activar el versioning hay que quitar ese prefijo para no terminar con `/v1/v1/...`.
2. **Todo endpoint lleva un guard de autenticación** (`AuthenticatedGuard`, `ApiKeyGuard`, `CombinedAuthGuard`, `PublicApiKeyGuard`...). Ver la tabla en [commons.md](references/commons.md). Hay dos excepciones: `health` y los gateways WebSocket, que por ahora se quedan como están.
3. **Agnóstico al proveedor.** El código de negocio nunca importa Redis, SNS, S3 ni ningún SDK directamente. Inyecta una clase abstracta (`CacheService`, `NotificationService`, `StorageService`...) y el módulo decide la implementación con `{ provide: Abstracta, useClass: Implementacion }`. Así se puede cambiar de proveedor tocando un solo archivo. Ver [infra.md](references/infra.md).
4. **Siempre usar el Logger de Nest.** Cada service, repository, consumer, guard y gateway declara `private readonly logger = new Logger(Clase.name)`. `nestjs-pino` envía los logs a Loki y de ahí a Grafana. Los mensajes llevan el prefijo del método: `this.logger.error(\`[create] Error producing job: ${error.message}\`)`. Nada de `console.log`.
5. **Errores con exceptions personalizadas.** Fuera de las colas, todo error de negocio se lanza como una clase que extiende `AppException`, desde `commons/exceptions/<dominio>/`. Nunca `throw new Error(...)` ni `NotFoundException` sueltos. Dentro de los consumers de cola se lanza `Error` para que BullMQ reintente.
6. **Validación con zod y nestjs-zod.** El schema zod va en `validations/`, y el dto de request es `createZodDto(Schema)`. `ZodValidationPipe` es global.
7. **Respuestas.** Cada handler lleva `@ResponseMessage('CODE_SUCCESS', 'Mensaje')`. El `ResponseInterceptor` global arma el envelope `{ success, code, message, data }`.
8. **Comentarios** en inglés y de una sola línea. Nada de bloques JSDoc.

## Nombres

- Archivos en kebab-case con sufijo de tipo: `.controller.ts`, `.service.ts`, `.module.ts`, `.dto.ts`, `.validation.ts`, `.exception.ts`, `.constant.ts`, `.types.ts`, `.helper.ts`, `.util.ts`, `.guard.ts`, `.decorator.ts`, `.pipe.ts`, `.serializer.ts`, `.repository.ts`, `.schema.ts`, `.producer.ts`, `.consumer.ts`, `.gateway.ts`, `.test.ts`, `.mock.ts`.
- Los tests van junto al archivo que prueban (`x.service.ts` y `x.service.test.ts`). Se usa Vitest, nunca `.spec.ts`.
- Las carpetas `controllers/` y `services/` van **siempre en plural**, aunque tengan un solo archivo.
- Las clases en PascalCase con el sufijo del tipo: `AmenityService`, `AmenityDbRepository`, `AmenityNotFoundException`, `AmenityProducer`.
- Imports con el alias `@/` para todo lo que esté fuera de la carpeta actual, y `./` solo dentro del mismo módulo.

## Orden de imports

Bloques separados por una línea en blanco, en este orden:

```ts
import { Body, Controller, Post, UseGuards } from '@nestjs/common'   // 1. nest / librerías

import { AuthenticatedGuard } from '@/commons/guards/authenticated.guard'  // 2. guards

import { AmenityService } from '../services/amenity.service'          // 3. services / repos / providers

import { Authenticated } from '@/commons/decorators/authenticated.decorator' // 4. decorators

import { CreateAmenityRequestDto } from '../dto/request/create-amenity-request.dto' // 5. dtos / types / constants

import { AmenityNotFoundException } from '@/commons/exceptions/amenity/amenity-not-found.exception' // 6. exceptions
```

## Fuera del alcance

- Lo propio de `mms-ai` (`agent-prompts/`, `modules/v2/`, `commons/prompt-blocks/`, providers de LLM) no sigue esta skill.
- `clemente-socket` (Nest legado) y `mms-mrc-fidelization` (Express con Prisma).
- El código existente que no cumple estas reglas no se migra de paso. Solo se corrige lo que estás tocando, o si el usuario lo pide.
