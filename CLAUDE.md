# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A turn-based business simulation game ("Business Simulator") played Kahoot-style. A facilitator creates a game and shares a PIN. Each player joins with the PIN and runs one company. Every cycle (a quarter), players decide on production, market, R&D and finance. The engine resolves a shared market and produces full financial statements.

The repo is not under git. It has two generations of code:

- **Current:**
  - `BussinessBackend/` is the NestJS 11 API: MongoDB, Redis/BullMQ, socket.io and Vitest. It follows the user's skill in `mms-nest-structure/`.
  - `BussinessFrontend/` is the UI: React 19, Vite, Tailwind 4, Framer Motion and Recharts.
- **Legacy 2023 prototypes, kept only as reference:**
  - `BusinessModel/` is a Rails API sketch.
  - `BussinessModelFrontend/` is a CRA form.
  - Neither works end to end.

**Source of truth for game rules:** `BussinessBackend/docs/reglas-de-negocio.md`. It was derived from the Google Sheet "Modelo de Negocio Base" (Drive id `14-1jCS_e3_onjw3KYzbX_FrIvds5TpMvlnDWivhXMSs`), then corrected and calibrated. All rules live in the pure engine at `BussinessBackend/src/modules/simulation/engine/`. Change the spec and the engine together. Facilitators can add bot-run companies (`bot.engine.ts`, spec §19). Bots decide at cycle close and never block the early close. Keep the accounting identity test (`cycle.engine.test.ts`) and the calibration script (`npm run calibrate`) green and balanced.

## Commands (new stack)

```
cd BussinessBackend
npm run dev:mongo            # MongoDB 7 on :27018 via mongodb-memory-server (the system mongod is 3.6, too old)
redis-server --daemonize yes # Redis on :6379
npm run start:dev            # API on :4000
npm test                     # engine + service tests
npm run calibrate -- 8 20    # strategy balance check (cycles, seeds)
npx ts-node --transpile-only scripts/smoke.ts   # e2e against a running API

cd BussinessFrontend
npm run dev                  # :5174 (5173 is taken by another local project); proxies /v1 and /socket.io to :4000
npm test && npm run typecheck && npm run build
```

Gotchas:
- Don't `pkill -f "node dist/main.js"`. It matches the shell's own command line. Kill by the PID listening on :4000 instead.
- Headless Chrome is at `/usr/bin/google-chrome`. Playwright's bundled browsers don't support this distro.

## Legacy commands

Rails API (`BusinessModel/`). It needs PostgreSQL (DBs `BussinessModel_development`/`_test`) and Redis on `localhost:6379`:
```
bundle install
bin/rails db:create db:schema:load   # or db:migrate
bin/rails server                      # :3000
```

Frontend (`BussinessModelFrontend/`). It also defaults to port 3000, so it clashes with Rails:
```
npm install
npm start
npm test                       # Jest watch mode; single test: npm test -- -t "name"
npm run build
```

`BusinessModel/Insomnia_2023-06-02.json` is an Insomnia collection with example request bodies for every endpoint. The `/settings` example contains realistic default game parameters.

## Rails architecture and known inconsistencies

- **Auth:** `ApplicationController` requires a bearer token on every action (`Authorization: Token token=...`). The token comes from `POST /login`, is stored on `users.token`, and expires 1 hour after `token_created_at`. Only `sessions#create` and `users#create` (`/signup`) skip auth.
- **Flow:** `POST /games` creates a `Game` plus a `Participation` for the creator. `POST /cycles` and `POST /user_game_cycles` link user + game + cycle. `POST /inputs` takes a nested payload (`production`, `market`, `research`, `finance`) and creates the four `Input*` records for a `user_game_cycle_id`.
- **`Setting`** is a single global row (`settings#update` uses `Setting.first`). It holds the economic parameters: interest rates, tax rate, material costs, capacities, starting cash, and so on.
- **The models and the schema disagree. The app does not work end to end as written:**
  - `db/schema.rb` keys every per-cycle table to `participations_cycle_id`, and it has no `cycles` or `user_game_cycles` tables.
  - The models (`UserGameCycle`, `Input*` `belongs_to :user_game_cycle`) and the controllers use a `Cycle`/`UserGameCycle` design.
  - Several models reference non-existent associations (`user_game_ciclo`, `user_gae_ciclo`), and their class names don't match the tables (`InventarioMp` vs `inventory_mps`).
  - Treat this code as a sketch of the data model, not as working behavior.
- `GamesController`/`SessionsController` contain leftover `Rails.cache` debug code that writes and increments a key `"a"`.
