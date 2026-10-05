# Tests y mocks

- Se usa **Vitest** (`vitest.workspace.mts`) con `@nestjs/testing`. Nunca Jest ni `.spec.ts`.
- El test va junto al archivo que prueba: `x.service.ts` → `x.service.test.ts`.
- Los fixtures van en la carpeta `mocks/` de la capa, en archivos `<x>.mock.ts`:
  - `modules/amenity/mocks/amenity.mock.ts`: dtos de request y response y sesión autenticada.
  - `db/amenity/mocks/amenity-db.repository.mock.ts`: documentos y dtos de BD.
  - Las exceptions esperadas se mockean en `mocks/<x>.exception.mock.ts` si hace falta.
- Las constantes de mock se escriben `mockAmenityId`, `mockAmenityDto`, `mockCreateAmenityRequest`.

## Qué probar por capa

| Capa | Se mockea | Se verifica |
|---|---|---|
| Controller | el service (`useValue` con `vi.fn()`) y las dependencias del guard | que delega con los argumentos correctos y devuelve lo que da el service |
| Service | repositories, producers, providers | la lógica, las ramas de error (la exception propia correcta) y las llamadas a dependencias |
| Repository | el `Model` de Mongoose (`getModelToken(X.name)`) | la query enviada y la serialización a camelCase |
| Consumer | el repository y los providers | el caso feliz, el `return` cuando no existe el recurso, el re-throw y el estado final en el último intento |
| Gateway | `server.to().emit` | el evento y el payload emitidos |

## Esqueleto

```ts
import { Test, TestingModule } from '@nestjs/testing'
import { vi } from 'vitest'

import { AmenityService } from '../services/amenity.service'
import { AmenityDbRepository } from '@/db/amenity/amenity-db.repository'

import { mockStoreId, mockAmenityDto } from '../mocks/amenity.mock'

import { AmenityNotFoundException } from '@/commons/exceptions/amenity/amenity-not-found.exception'

const mockAmenityRepository = {
  findById: vi.fn(),
}

describe('AmenityService', () => {
  let service: AmenityService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AmenityService, { provide: AmenityDbRepository, useValue: mockAmenityRepository }],
    }).compile()

    service = module.get(AmenityService)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('throws AmenityNotFoundException when amenity belongs to another store', async () => {
    mockAmenityRepository.findById.mockResolvedValue({ ...mockAmenityDto, storeId: 'other' })

    await expect(service.findOne(mockStoreId, mockAmenityDto.id)).rejects.toThrow(AmenityNotFoundException)
  })
})
```

Para dependencias abstractas (`CacheService`, `NotificationService`), el mock se provee con el token de la clase abstracta: `{ provide: CacheService, useValue: mockCacheService }`.
