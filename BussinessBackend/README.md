# BussinessBackend

API del Business Simulator: un juego de negocios por trimestres al estilo Kahoot. Un facilitador crea la partida y los jugadores entran con un PIN. Cada jugador dirige una empresa que compite con las demás.

- **Stack:** NestJS 11, MongoDB (Mongoose), Redis + BullMQ, socket.io y Vitest.
- **Estructura:** sigue las convenciones de la skill `mms-nest-structure/`.
- **Reglas del juego:** están en [`docs/reglas-de-negocio.md`](docs/reglas-de-negocio.md). Es la fuente de verdad.

## Cómo levantarlo

```bash
npm install
cp .env.example .env
npm run dev:mongo                 # MongoDB 7 local en :27018 (sin Docker)
redis-server --daemonize yes      # Redis en :6379
npm run start:dev                 # API en :4000
```

`npm run dev:mongo` usa `mongodb-memory-server` y guarda los datos en `.data/mongo7`. Si ya tienes MongoDB 6 o superior, apunta `MONGO_URI` a esa instancia.

| Script | Para qué |
|---|---|
| `npm test` | Tests de Vitest: motor (cuadre contable, préstamo francés, inventarios, mercado, determinismo) y servicios |
| `npm run typecheck` | Chequeo de tipos |
| `npm run calibrate -- 8 20` | Enfrenta a los bots (4 estrategias más una empresa pasiva, y los 3 niveles) en 20 semillas para verificar que ninguna estrategia domine siempre y que los niveles queden ordenados. `OVERRIDES='{"finance":{...}}'` prueba otros parámetros |
| `npx ts-node --transpile-only scripts/smoke.ts` | Prueba e2e contra la API corriendo: registro, partida, 2 jugadores, 2 ciclos y cierre forzado |

## Arquitectura

```
src/
├── modules/
│   ├── simulation/engine/   ← motor puro y determinista (sin Nest ni Mongo); aquí viven todas las reglas, incluidos los bots
│   ├── simulation/services/ ← orquesta el cierre de ciclo, idempotente frente a reintentos
│   ├── auth/                ← registro/login del facilitador (JWT)
│   ├── games/               ← facilitador: crear, iniciar, forzar cierre, ver resultados
│   ├── play/                ← jugadores: lobby por PIN, unirse, panel, borrador, validar, enviar, informes
│   ├── live/                ← gateway socket.io (namespace /live, salas game:<id>)
│   └── health/
├── db/                      ← facilitators, games, companies, decisions, cycle_results, market_results
├── queues/                  ← cola cycle-queue: cierre por plazo (job diferido) o inmediato
└── commons/                 ← guards (JWT y token de jugador), exceptions, interceptor de respuesta, helpers
```

### Ciclo de vida de una partida

1. **Crear y unirse.** El facilitador crea la partida y recibe un PIN de 6 dígitos. Los jugadores hacen `POST /v1/play/join` y reciben un `playerToken`, que se envía en el header `x-player-token`.
2. **Iniciar.** El facilitador hace `POST /v1/games/:id/start`. Se genera la serie económica con la semilla de la partida, se abre el ciclo 1 y se programa un job diferido para su vencimiento.
3. **Decidir.** Los jugadores guardan borradores (`PUT /play/decisions/draft`), validan (`POST /play/decisions/validate`) y envían (`POST /play/decisions/submit`). La validación devuelve errores bloqueantes, avisos y una proyección de caja, demanda y uso de planta.
4. **Cerrar el ciclo.** Ocurre con el primero de tres disparadores: todos enviaron, venció el plazo o el facilitador fuerza el cierre (`POST /games/:id/close-cycle`).
   - El consumer hace un *compare-and-set* `OPEN → PROCESSING`, corre el motor y persiste.
   - Si falla, el ciclo vuelve a `OPEN` y BullMQ reintenta.
   - Un reintento usa el snapshot `state_before`, así que nunca aplica un ciclo dos veces.
   - Las empresas que no enviaron repiten sus decisiones operativas del ciclo anterior. Las decisiones financieras puntuales (préstamos, acciones, dividendos, etc.) vuelven a 0.
5. **Avisos en tiempo real.** Por socket se emiten `lobby.updated`, `game.started`, `decision.submitted`, `cycle.processing`, `cycle.closed` y `game.finished`.

Todas las respuestas usan el formato `{ success, code, message, data }`. Los errores llevan `{ success: false, code, message, details }`.

## Endpoints

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/v1/auth/register`, `/v1/auth/login` | público |
| GET | `/v1/auth/me` | facilitador |
| GET | `/v1/games/settings/default` | facilitador |
| POST/GET | `/v1/games` | facilitador |
| GET | `/v1/games/:id` | facilitador |
| POST | `/v1/games/:id/start`, `/v1/games/:id/close-cycle` | facilitador |
| GET | `/v1/games/:id/cycles/:cycle` | facilitador |
| POST | `/v1/games/:id/bots` | facilitador (solo en lobby): agrega empresas controladas por bots |
| DELETE | `/v1/games/:id/companies/:companyId` | facilitador (solo en lobby) |
| GET | `/v1/play/lobby/:pin` | público (el PIN es la credencial) |
| POST | `/v1/play/join` | público |
| GET | `/v1/play/me` | jugador |
| PUT | `/v1/play/decisions/draft` | jugador |
| POST | `/v1/play/decisions/validate`, `/v1/play/decisions/submit` | jugador |
| GET | `/v1/play/reports/:cycle` | jugador |
| GET | `/v1/health` | público |

## Despliegue en Railway (Docker)

El backend y el frontend se despliegan como **dos servicios separados**. Cada uno tiene su propio `Dockerfile` y `railway.json`.

1. En el proyecto de Railway, agrega un servicio **Redis** (New → Database → Redis).
2. Crea el servicio **Backend** desde el repo de GitHub:
   - **Root Directory: vacío.** El contexto del build es la raíz del monorepo, y el Dockerfile copia `BussinessBackend/`.
   - **Railway Config File:** `/BussinessBackend/railway.json`. Este archivo define `dockerfilePath` y `watchPatterns`, así que solo redespliega cuando cambia esta carpeta.
   - Si existe la variable `RAILWAY_DOCKERFILE_PATH`, bórrala.
3. Configura sus variables (ver `.env.example`):

   | Variable | Valor |
   |---|---|
   | `MONGO_URI` | URI de Atlas, **incluyendo el nombre de la base de datos** (`.../business-simulator?...`) |
   | `REDIS_URL` | `${{Redis.REDIS_URL}}` |
   | `JWT_SECRET` | resultado de `openssl rand -hex 32` |
   | `CORS_ORIGIN` | `https://${{Frontend.RAILWAY_PUBLIC_DOMAIN}}` (o el dominio propio del frontend) |

   `PORT` lo inyecta Railway; no lo definas.
4. En **Settings → Networking → Generate Domain**, crea el dominio público. El health check usa `/v1/health`.
5. En MongoDB Atlas → **Network Access**, permite `0.0.0.0/0`. Railway no tiene IP fija en los planes básicos.

Para probar la imagen en local:

```bash
# desde la raíz del repo
docker build -f BussinessBackend/Dockerfile -t bsim-backend .
docker run -p 4000:4000 --env-file BussinessBackend/.env bsim-backend
```
