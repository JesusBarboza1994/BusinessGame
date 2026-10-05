import { addLayer, consumeLayers, layersValue } from './inventory.engine'

import { ValuationMethod } from './engine.types'

describe('inventory engine', () => {
  it('values FIFO with the oldest cost first', () => {
    let layers = addLayer([], 100, 10, ValuationMethod.FIFO)
    layers = addLayer(layers, 100, 20, ValuationMethod.FIFO)
    const result = consumeLayers(layers, 150)

    expect(result.cost).toBe(100 * 10 + 50 * 20)
    expect(layersValue(result.layers)).toBe(50 * 20)
  })

  it('values weighted average with a single blended layer', () => {
    let layers = addLayer([], 100, 10, ValuationMethod.WEIGHTED_AVERAGE)
    layers = addLayer(layers, 100, 20, ValuationMethod.WEIGHTED_AVERAGE)
    const result = consumeLayers(layers, 150)

    expect(result.cost).toBe(150 * 15)
    expect(layersValue(result.layers)).toBe(50 * 15)
  })
})
