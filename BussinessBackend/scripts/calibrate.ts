// Plays the bot archetypes against each other over many seeds to check balance between strategies and levels
import { decideForBot } from '@/modules/simulation/engine/bot.engine'
import { defaultDecisions } from '@/modules/simulation/engine/decisions.engine'
import { generateEconomy } from '@/modules/simulation/engine/economy.engine'
import { DEFAULT_GAME_SETTINGS } from '@/modules/simulation/engine/engine.constant'
import { BotLevel, BotStrategy, GameSettings } from '@/modules/simulation/engine/engine.types'
import { simulate, Strategy } from '@/modules/simulation/engine/mocks/engine.mock'

function deepMerge<T>(target: T, patch: unknown): T {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return patch as T
  const out = { ...(target as Record<string, unknown>) }
  for (const [key, value] of Object.entries(patch)) out[key] = deepMerge(out[key], value)
  return out as T
}

// Market average prices are not part of a company's state, so bots here price off the reference price
const bot = (id: string, strategy: BotStrategy, level: BotLevel, companies: number, settings: GameSettings): Strategy => {
  const economy = generateEconomy(settings)
  return (cycle, state, s) =>
    decideForBot(s, state, { strategy, level }, {
      cycle,
      market: { cycle: cycle - 1, growthIndex: 1, latentDemand: 0, initialCompanies: companies },
      economy,
      companies,
      seed: s.seed,
      companyId: id,
      averagePrice: null,
    })
}

const passive: Strategy = (_cycle, state, s) => {
  const d = defaultDecisions(s, state)
  d.marketing.advertising = { A: 0, B: 0 }
  d.research.quality = { A: 0, B: 0 }
  return d
}

function tournament(name: string, cycles: number, seeds: number, lineup: (settings: GameSettings) => Record<string, Strategy>): void {
  const wins: Record<string, number> = {}
  const tsr: Record<string, number> = {}
  let bankruptcies = 0
  for (let seed = 1; seed <= seeds; seed++) {
    const settings: GameSettings = deepMerge(structuredClone(DEFAULT_GAME_SETTINGS), JSON.parse(process.env.OVERRIDES ?? '{}'))
    settings.cycles = cycles
    settings.seed = seed
    const { outputs, states } = simulate(settings, lineup(settings))
    const last = outputs[outputs.length - 1]
    wins[last.ranking[0].companyId] = (wins[last.ranking[0].companyId] ?? 0) + 1
    for (const entry of last.ranking) tsr[entry.companyId] = (tsr[entry.companyId] ?? 0) + entry.tsr / seeds
    bankruptcies += Object.values(states).filter((state) => state.status === 'BANKRUPT').length
  }
  console.log(`\n== ${name} (${cycles} cycles x ${seeds} seeds)`)
  console.log('wins', wins)
  console.log('avg TSR', Object.fromEntries(Object.entries(tsr).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v.toFixed(3)])))
  console.log('bankruptcies', bankruptcies)
}

const cycles = Number(process.argv[2] ?? 8)
const seeds = Number(process.argv[3] ?? 20)

tournament('strategies (HARD) + passive', cycles, seeds, (settings) => ({
  balanced: bot('balanced', BotStrategy.BALANCED, BotLevel.HARD, 5, settings),
  lowCost: bot('lowCost', BotStrategy.LOW_COST, BotLevel.HARD, 5, settings),
  premium: bot('premium', BotStrategy.PREMIUM, BotLevel.HARD, 5, settings),
  growth: bot('growth', BotStrategy.GROWTH, BotLevel.HARD, 5, settings),
  passive,
}))

tournament('levels (one per strategy)', cycles, seeds, (settings) =>
  Object.fromEntries(
    Object.values(BotStrategy).flatMap((strategy) =>
      Object.values(BotLevel).map((level) => [`${strategy}-${level}`, bot(`${strategy}-${level}`, strategy, level, 12, settings)]),
    ),
  ),
)
