import { Injectable } from '@nestjs/common'
import { Types } from 'mongoose'

import { GameDb } from './game-db.schema'

import { GameDbDto, UpdateGameDbDto } from './game-db.dto'

@Injectable()
export class GameDbSerializer {
  toCamelCase(game: GameDb): GameDbDto {
    return {
      id: game._id.toString(),
      facilitatorId: game.facilitator_id.toString(),
      name: game.name,
      pin: game.pin,
      status: game.status,
      settings: game.settings,
      cycleDurationMinutes: game.cycle_duration_minutes,
      currentCycle: game.current_cycle,
      cycleStatus: game.cycle_status,
      cycleDeadline: game.cycle_deadline,
      economy: game.economy,
      marketState: game.market_state,
      ranking: game.ranking ?? [],
      startedAt: game.started_at,
      finishedAt: game.finished_at,
      createdAt: game.created_at,
    }
  }

  toCamelCaseArray(games: GameDb[]): GameDbDto[] {
    return games.map((game) => this.toCamelCase(game))
  }

  toSnakeCaseUpdate(data: UpdateGameDbDto): Partial<GameDb> {
    const update: Partial<GameDb> = {}
    if (data.status !== undefined) update.status = data.status
    if (data.currentCycle !== undefined) update.current_cycle = data.currentCycle
    if (data.cycleStatus !== undefined) update.cycle_status = data.cycleStatus
    if (data.cycleDeadline !== undefined) update.cycle_deadline = data.cycleDeadline
    if (data.economy !== undefined) update.economy = data.economy
    if (data.marketState !== undefined) update.market_state = data.marketState
    if (data.ranking !== undefined) update.ranking = data.ranking
    if (data.startedAt !== undefined) update.started_at = data.startedAt
    if (data.finishedAt !== undefined) update.finished_at = data.finishedAt
    return update
  }

  toObjectId(id: string): Types.ObjectId {
    return new Types.ObjectId(id)
  }
}
