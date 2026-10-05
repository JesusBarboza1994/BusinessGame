# Colas BullMQ (`queues/`)

```
queues/
├── queue.module.ts                   ← conexión BullMQ (redis) global
├── queues.constant.ts                ← nombres de colas y jobs
├── queue.utils.ts                    ← isLastAttempt
├── shared/
│   └── amenity-job.dto.ts            ← payload del job (lo comparten el producer y el consumer)
├── producers/
│   ├── amenity.producer.ts
│   ├── amenity.producer.test.ts
│   └── amenity-producer.module.ts
└── consumers/
    ├── amenity.consumer.ts
    └── amenity.consumer.test.ts
```

## queues.constant.ts

```ts
export const AMENITY_QUEUE = 'amenity-queue'

export enum AmenityJobName {
  VALIDATE = 'amenity.validate',
}
```

## Producer + módulo

```ts
@Injectable()
export class AmenityProducer {
  private readonly jobOptions: JobsOptions = {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true,
    removeOnFail: { count: 50 },
  }

  constructor(@InjectQueue(AMENITY_QUEUE) private readonly queue: Queue) {}

  async produce(data: AmenityJobDto): Promise<void> {
    await this.queue.add(AmenityJobName.VALIDATE, data, this.jobOptions)
  }
}
```

```ts
@Module({
  imports: [BullModule.registerQueue({ name: AMENITY_QUEUE, streams: { events: { maxLen: 1000 } } })],
  providers: [AmenityProducer],
  exports: [AmenityProducer],
})
export class AmenityProducerModule {}
```

El módulo de la feature importa `AmenityProducerModule` y registra `AmenityConsumer` en sus `providers`.

## Consumer

```ts
@Processor(AMENITY_QUEUE)
export class AmenityConsumer extends WorkerHost {
  private readonly logger = new Logger(AmenityConsumer.name)

  constructor(private readonly amenityRepository: AmenityDbRepository) {
    super()
  }

  async process(job: Job<AmenityJobDto>): Promise<void> {
    const { storeId, amenityId } = job.data

    try {
      this.logger.log(`[process] amenity ${amenityId} store ${storeId}`)
      // ...
    } catch (error) {
      this.logger.error(`[process] attempt ${job.attemptsMade + 1}: ${(error as Error).message}`)
      if (isLastAttempt(job)) await this.amenityRepository.updateStatus(amenityId, TaskItemStatus.FAILED)
      throw error
    }
  }
}
```

Reglas:
- Dentro de `process` se lanza `Error` normal (no `AppException`) para que BullMQ reintente.
- Si el recurso ya no existe, se loguea con `warn` y se hace `return`. No se reintenta.
- El estado final de fallo se escribe solo cuando `isLastAttempt(job)` es verdadero.
- El payload es un dto en `queues/shared/`, nunca un tipo inline.
