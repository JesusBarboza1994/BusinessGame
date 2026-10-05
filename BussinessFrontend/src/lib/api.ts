import { API_URL } from './env'
import { session } from './session'

import type {
  BotLevel,
  BotStrategy,
  CompanyDecisions,
  CycleDetail,
  DecisionValidation,
  GameDetail,
  GamePreset,
  GameSummary,
  LobbyInfo,
  PlayerCycleReport,
  PlayerDashboard,
  ValuationMethod,
} from './types'

const BASE = `${API_URL}/v1`

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

type Auth = 'facilitator' | 'player' | 'none'

async function request<T>(method: string, path: string, body?: unknown, auth: Auth = 'none'): Promise<T> {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (auth === 'facilitator' && session.facilitatorToken()) headers.authorization = `Bearer ${session.facilitatorToken()}`
  if (auth === 'player' && session.playerToken()) headers['x-player-token'] = session.playerToken() as string
  let response: Response
  try {
    response = await fetch(`${BASE}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'No pudimos conectar con el servidor. Revisa tu conexión.')
  }
  const json = await response.json().catch(() => null)
  if (!response.ok || !json?.success) {
    throw new ApiError(response.status, json?.code ?? 'UNKNOWN', json?.message ?? 'Error inesperado', json?.details)
  }
  return json.data as T
}

export const api = {
  register: (body: { name: string; email: string; password: string }) =>
    request<{ token: string; facilitator: { id: string; name: string; email: string } }>('POST', '/auth/register', body),
  login: (body: { email: string; password: string }) =>
    request<{ token: string; facilitator: { id: string; name: string; email: string } }>('POST', '/auth/login', body),
  me: () => request<{ id: string; name: string; email: string }>('GET', '/auth/me', undefined, 'facilitator'),

  defaults: () => request<{ settings: Record<string, unknown>; presets: GamePreset[] }>('GET', '/games/settings/default', undefined, 'facilitator'),
  createGame: (body: { name: string; cycles: number; cycleDurationMinutes: number; settings?: Record<string, unknown> }) =>
    request<GameDetail>('POST', '/games', body, 'facilitator'),
  listGames: () => request<GameSummary[]>('GET', '/games', undefined, 'facilitator'),
  game: (id: string) => request<GameDetail>('GET', `/games/${id}`, undefined, 'facilitator'),
  startGame: (id: string) => request<GameDetail>('POST', `/games/${id}/start`, undefined, 'facilitator'),
  closeCycle: (id: string) => request<{ queued: boolean }>('POST', `/games/${id}/close-cycle`, undefined, 'facilitator'),
  cycle: (id: string, cycle: number) => request<CycleDetail>('GET', `/games/${id}/cycles/${cycle}`, undefined, 'facilitator'),
  addBots: (id: string, body: { count: number; strategy?: BotStrategy; level: BotLevel }) => request<GameDetail>('POST', `/games/${id}/bots`, body, 'facilitator'),
  removeCompany: (id: string, companyId: string) => request<{ removed: boolean }>('DELETE', `/games/${id}/companies/${companyId}`, undefined, 'facilitator'),

  lobby: (pin: string) => request<LobbyInfo>('GET', `/play/lobby/${pin}`),
  join: (body: { pin: string; companyName: string; avatar: string; color: string; valuationMethod: ValuationMethod }) =>
    request<{ playerToken: string; companyId: string; gameId: string }>('POST', '/play/join', body),
  dashboard: () => request<PlayerDashboard>('GET', '/play/me', undefined, 'player'),
  saveDraft: (decisions: CompanyDecisions) => request<DecisionValidation>('PUT', '/play/decisions/draft', { decisions }, 'player'),
  validate: (decisions: CompanyDecisions) => request<DecisionValidation>('POST', '/play/decisions/validate', { decisions }, 'player'),
  submit: (decisions: CompanyDecisions) => request<DecisionValidation>('POST', '/play/decisions/submit', { decisions }, 'player'),
  report: (cycle: number) => request<PlayerCycleReport>('GET', `/play/reports/${cycle}`, undefined, 'player'),
}
