import { createRng, hashSeed } from './random.util'

import { EconomySeries, GameSettings } from './engine.types'

const SALT_ECONOMY = 11
const FORECAST_HORIZON = 4

// Generates the whole economic index path at game creation so forecasts point to real future values
export function generateEconomy(settings: GameSettings): EconomySeries {
  const rng = createRng(hashSeed(settings.seed, SALT_ECONOMY))
  const { drift, volatility, forecastNoiseQuarter, forecastNoiseYear } = settings.economy
  const length = settings.cycles + FORECAST_HORIZON + 1
  const index: number[] = [100]
  for (let t = 1; t < length; t++) {
    index.push(index[t - 1] * (1 + drift + rng.normal(0, volatility)))
  }
  const forecastNextQuarter: number[] = []
  const forecastNextYear: number[] = []
  for (let t = 0; t <= settings.cycles; t++) {
    forecastNextQuarter.push(index[t + 1] * (1 + rng.normal(0, forecastNoiseQuarter)))
    forecastNextYear.push(index[t + FORECAST_HORIZON] * (1 + rng.normal(0, forecastNoiseYear)))
  }
  return { index, forecastNextQuarter, forecastNextYear }
}
