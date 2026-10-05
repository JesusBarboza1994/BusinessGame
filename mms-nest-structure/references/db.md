# Capa de datos Mongo (`db/<entity>/`)

Cada colección tiene su carpeta con el prefijo `<entity>-db`. El resto del servicio solo ve el **repository** y el **dto camelCase**, nunca el documento de Mongoose.

```
db/amenity/
├── amenity-db.schema.ts            ← @Schema, campos en snake_case, colección, índices
├── amenity-db.dto.ts               ← interfaces camelCase: AmenityDbDto, CreateAmenityDbDto, UpdateAmenityDbDto
├── amenity-db.serializer.ts        ← toCamelCase · toCamelCaseArray · toObjectId
├── amenity-db.repository.ts        ← todas las queries, siempre devuelve el dto
├── amenity-db.repository.test.ts
├── amenity-db.module.ts            ← MongooseModule.forFeature, exporta el repository y el serializer
└── mocks/
    └── amenity-db.repository.mock.ts
```

Si una carpeta tiene más de una colección relacionada (ej. `feedback` y `preprocessed-feedback`), cada colección lleva su propio juego de `*-db.schema/dto/serializer/repository/module` en la misma carpeta.

## Schema

```ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, SchemaTypes, Types } from 'mongoose'

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'amenities',
})
export class AmenityDb {
  @Prop({ type: SchemaTypes.ObjectId, auto: true })
  _id: Types.ObjectId

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  store_id: Types.ObjectId

  @Prop({ type: String, enum: AmenityType, required: true })
  type: AmenityType

  @Prop({ type: Date, default: Date.now })
  created_at: Date

  @Prop({ type: Date })
  updated_at: Date
}

export const AmenitySchema = SchemaFactory.createForClass(AmenityDb)

AmenitySchema.index({ store_id: 1, type: 1 }, { unique: true })

export type AmenityDocument = HydratedDocument<AmenityDb>
```

- La clase se llama `<Entity>Db`, los campos van en snake_case y `collection` se declara explícito.
- Los enums se importan de `commons/constants/<x>.constant.ts`.

## Dto (interfaces)

```ts
export interface AmenityDbDto {
  id: string
  storeId: string
  type: AmenityType
  createdAt: Date
  updatedAt?: Date
}

export interface CreateAmenityDbDto {
  storeId: string
  type: AmenityType
}

export interface UpdateAmenityDbDto {
  type?: AmenityType
}
```

## Serializer

```ts
@Injectable()
export class AmenityDbSerializer {
  toCamelCase(amenity: AmenityDb): AmenityDbDto {
    return {
      id: amenity._id.toString(),
      storeId: amenity.store_id.toString(),
      type: amenity.type,
      createdAt: amenity.created_at,
      updatedAt: amenity.updated_at,
    }
  }

  toCamelCaseArray(amenities: AmenityDb[]): AmenityDbDto[] {
    return amenities.map((amenity) => this.toCamelCase(amenity))
  }

  toObjectId(id: string): Types.ObjectId {
    return new Types.ObjectId(id)
  }
}
```

## Repository

```ts
@Injectable()
export class AmenityDbRepository {
  private readonly logger = new Logger(AmenityDbRepository.name)

  constructor(
    @InjectModel(AmenityDb.name) private readonly amenityModel: Model<AmenityDb>,
    private readonly serializer: AmenityDbSerializer,
  ) {}

  async findById(id: string): Promise<AmenityDbDto | null> {
    const amenity = await this.amenityModel.findById(id)
    if (!amenity) return null
    return this.serializer.toCamelCase(amenity)
  }
}
```

- Recibe y devuelve dtos en camelCase. La conversión a snake_case y ObjectId ocurre aquí.
- Si no encuentra nada devuelve `null`. **No** lanza exceptions de negocio, eso lo decide el service.
- Nombres de métodos: `create`, `createMany`, `findById`, `findByStoreId`, `findByStoreIdAnd<X>`, `updateById`, `updateStatus`, `deleteById`.

## Module

```ts
@Module({
  imports: [MongooseModule.forFeature([{ name: AmenityDb.name, schema: AmenitySchema }])],
  providers: [AmenityDbRepository, AmenityDbSerializer],
  exports: [AmenityDbRepository, AmenityDbSerializer],
})
export class AmenityDbModule {}
```
