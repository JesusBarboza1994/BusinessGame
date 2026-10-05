import { InventoryLayer, ValuationMethod } from './engine.types'

export const layersUnits = (layers: InventoryLayer[]): number => layers.reduce((acc, layer) => acc + layer.units, 0)

export const layersValue = (layers: InventoryLayer[]): number =>
  layers.reduce((acc, layer) => acc + layer.units * layer.unitCost, 0)

export function addLayer(layers: InventoryLayer[], units: number, unitCost: number, method: ValuationMethod): InventoryLayer[] {
  if (units <= 0) return layers.map((layer) => ({ ...layer }))
  if (method === ValuationMethod.FIFO) return [...layers.map((layer) => ({ ...layer })), { units, unitCost }]
  const totalUnits = layersUnits(layers) + units
  const totalValue = layersValue(layers) + units * unitCost
  return [{ units: totalUnits, unitCost: totalValue / totalUnits }]
}

// Takes units out from the oldest layer first; for weighted average there is only one layer
export function consumeLayers(layers: InventoryLayer[], units: number): { layers: InventoryLayer[]; cost: number } {
  let pending = units
  let cost = 0
  const remaining: InventoryLayer[] = []
  for (const layer of layers) {
    if (pending <= 0) {
      remaining.push({ ...layer })
      continue
    }
    const taken = Math.min(layer.units, pending)
    cost += taken * layer.unitCost
    pending -= taken
    if (layer.units - taken > 0) remaining.push({ units: layer.units - taken, unitCost: layer.unitCost })
  }
  return { layers: remaining, cost }
}
