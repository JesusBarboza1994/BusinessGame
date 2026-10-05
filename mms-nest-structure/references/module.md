# Módulo de feature (`modules/<feature>/`)

## Estructura

```
modules/feedback/
├── feedback.module.ts
├── feedback.constant.ts                  (opcional: enums/eventos propios del módulo)
├── controllers/
│   ├── feedback.controller.ts
│   └── feedback.controller.test.ts
├── services/
│   ├── feedback.service.ts
│   └── feedback.service.test.ts
├── gateway/                              (solo si emite eventos WebSocket)
│   ├── feedback.gateway.ts
│   └── feedback.gateway.test.ts
├── dto/
│   ├── request/create-feedback-request.dto.ts
│   ├── response/create-feedback-response.dto.ts
│   └── gateway/feedback-updated-gateway-response.dto.ts   (si hay gateway)
├── validations/
│   └── create-feedback.validation.ts
└── mocks/
    └── feedback.mock.ts
```

- `controllers/` y `services/` siempre en plural, aunque haya un solo archivo.
- Los dto de request van en `dto/request/` y los de response en `dto/response/`, nunca mezclados en `dto/`.
- Los mocks van en `mocks/<x>.mock.ts`, nunca en `mocks/mocks.ts`.

## Validación y dto de request

```ts
// validations/create-feedback.validation.ts
import { z } from 'zod'

export const CreateFeedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
})
```

```ts
// dto/request/create-feedback-request.dto.ts
import { createZodDto } from 'nestjs-zod'

import { CreateFeedbackSchema } from '@/modules/feedback/validations/create-feedback.validation'

export class CreateFeedbackRequestDto extends createZodDto(CreateFeedbackSchema) {}
```

El dto de response es una `interface` (o un `createZodDto` si también se documenta en Swagger) con lo que devuelve el service.

## Controller

```ts
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'

import { AuthenticatedGuard } from '@/commons/guards/authenticated.guard'

import { FeedbackService } from '../services/feedback.service'

import { Authenticated } from '@/commons/decorators/authenticated.decorator'
import { ResponseMessage } from '@/commons/decorators/response-message.decorator'

import { AuthenticatedSessionDto } from '@/commons/dto/authenticate.dto'
import { CreateFeedbackRequestDto } from '../dto/request/create-feedback-request.dto'
import { CreateFeedbackResponseDto } from '../dto/response/create-feedback-response.dto'

@Controller({ path: 'feedback', version: '1' })
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @UseGuards(AuthenticatedGuard)
  @ResponseMessage('FEEDBACK_CREATE_SUCCESS', 'Feedback created successfully')
  async create(
    @Body() body: CreateFeedbackRequestDto,
    @Authenticated() { user }: AuthenticatedSessionDto,
  ): Promise<CreateFeedbackResponseDto> {
    return this.feedbackService.create(user.storeId, body)
  }
}
```

Reglas:
- `@Controller({ path, version })` es obligatorio.
- Cada handler lleva `@UseGuards(...)` (o se aplica a nivel de clase si todos comparten guard) y `@ResponseMessage(...)`.
- El controller no tiene lógica. Solo extrae los parámetros (`@Body`, `@Param`, `@Headers('store-id')`, `@Authenticated()`) y delega al service.
- Las rutas estáticas (`'bulk'`, `'reject'`) van **antes** que las rutas con parámetro (`':id'`).

## Service

```ts
import { Injectable, Logger } from '@nestjs/common'

import { FeedbackDbRepository } from '@/db/feedback/feedback-db.repository'

import { CreateFeedbackRequestDto } from '../dto/request/create-feedback-request.dto'
import { CreateFeedbackResponseDto } from '../dto/response/create-feedback-response.dto'

import { FeedbackNotFoundException } from '@/commons/exceptions/feedback/feedback-not-found.exception'

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name)

  constructor(private readonly feedbackRepository: FeedbackDbRepository) {}

  async findOne(storeId: string, id: string): Promise<CreateFeedbackResponseDto> {
    const feedback = await this.feedbackRepository.findById(id)
    if (feedback?.storeId !== storeId) throw new FeedbackNotFoundException()

    return feedback
  }
}
```

Reglas:
- Siempre con `Logger`.
- Los errores se lanzan con exceptions de `commons/exceptions/`.
- Accede a datos solo mediante repositorios de `db/` y a otros servicios solo mediante `providers/`.
- Nunca importa Redis, SNS, S3 ni SDKs directamente (ver [infra.md](infra.md)).
- Si se encola trabajo en modo "fire and forget", el error se captura y se loguea: `void this.producer.produce(...).catch((error: Error) => this.logger.error(\`[create] ...\`))`.

## Module

```ts
import { Module } from '@nestjs/common'

import { FeedbackDbModule } from '@/db/feedback/feedback-db.module'
import { FeedbackProducerModule } from '@/queues/producers/feedback-producer.module'

import { FeedbackController } from './controllers/feedback.controller'
import { FeedbackService } from './services/feedback.service'
import { FeedbackGateway } from './gateway/feedback.gateway'

@Module({
  imports: [FeedbackDbModule, FeedbackProducerModule],
  controllers: [FeedbackController],
  providers: [FeedbackService, FeedbackGateway],
  exports: [FeedbackService],
})
export class FeedbackModule {}
```

Registrar el módulo en `app.module.ts`.

## Gateway (WebSocket)

Sirve para que el backend **avise** al dashboard en tiempo real (socket.io) cuando algo cambia, sin que el front tenga que preguntar.

- Va dentro del módulo, en `modules/<feature>/gateway/<feature>.gateway.ts`, y extiende `commons/gateways/base-gateway.ts`.
- El service del mismo módulo lo inyecta y llama a sus métodos después de cambiar datos.
- Usa `this.emitToRoom(roomId, Evento, payload)`. Los nombres de evento van como enum en `<feature>.constant.ts`, y el payload tiene su dto en `dto/gateway/`.
- Por ahora queda como excepción a la regla de guards: se deja la autenticación como está en `BaseGateway`.

```ts
@Injectable()
export class FeedbackGateway extends BaseGateway {
  constructor() {
    super(FeedbackGateway.name)
  }

  async notifyFeedbackUpdated(restaurantId: string, payload: FeedbackUpdatedGatewayResponseDto): Promise<void> {
    try {
      this.emitToRoom<FeedbackUpdatedGatewayResponseDto>(restaurantId, FeedbackGatewayEvent.UPDATED, payload)
    } catch (error) {
      this.logger.error(`[notifyFeedbackUpdated] ${(error as Error).message}`)
    }
  }
}
```

## Health

`modules/health/` con `health.controller.ts`, `health.controller.test.ts` y `health.module.ts`. Es el único controller sin guard. También va versionado.
