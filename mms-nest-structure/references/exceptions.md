# Exceptions (`commons/exceptions/`)

```
commons/exceptions/
├── app.exception.ts                         ← base, no se toca
├── amenity/
│   ├── amenity-not-found.exception.ts
│   └── amenity-already-exists.exception.ts
└── authenticate/
    └── token-required.exception.ts
```

- Una carpeta por dominio, con el mismo nombre que el módulo o el provider.
- Un archivo por exception: `<dominio>-<problema>.exception.ts`.
- El `code` va en SCREAMING_SNAKE con el prefijo del dominio (`AMENITY_NOT_FOUND`), y el `message` en inglés.

```ts
import { HttpStatus } from '@nestjs/common'

import { AppException } from '../app.exception'

export class AmenityNotFoundException extends AppException {
  constructor(details?: object) {
    super(HttpStatus.NOT_FOUND, 'AMENITY_NOT_FOUND', 'Amenity not found', details)
  }
}
```

## Cuándo usar cada cosa

| Contexto | Qué lanzar |
|---|---|
| Service, controller, provider, guard | Siempre una exception propia que extiende `AppException` |
| Error de una API externa en un provider | Se captura, se loguea y se relanza envuelto en una exception propia (ej. `AiRequestFailedException`) con `details` |
| Repository | No lanza por "no encontrado", devuelve `null` |
| Consumer de cola (`process`) | `throw new Error(...)` para que BullMQ reintente. Se loguea antes y se usa `isLastAttempt(job)` para marcar el estado final |

Nunca `throw new Error()`, `NotFoundException` ni `BadRequestException` de Nest fuera de las colas.
