import type { PlayerDashboard } from '@/lib/types'

export interface Achievement {
  id: string
  emoji: string
  title: string
  description: string
  unlocked: boolean
}

// Lightweight badges computed from the player's own history to reward good management habits
export function computeAchievements(data: PlayerDashboard): Achievement[] {
  const history = data.history
  const report = data.lastReport
  return [
    { id: 'profit', emoji: '💵', title: 'Primera utilidad', description: 'Cierra un trimestre con utilidad positiva.', unlocked: history.some((h) => h.netIncome > 0) },
    { id: 'streak', emoji: '🔥', title: 'Racha ganadora', description: 'Tres trimestres seguidos con utilidad.', unlocked: history.some((_, i) => i >= 2 && history.slice(i - 2, i + 1).every((h) => h.netIncome > 0)) },
    { id: 'leader', emoji: '👑', title: 'Líder', description: 'Alcanza el primer puesto del ranking.', unlocked: history.some((h) => h.position === 1) },
    { id: 'share', emoji: '🛒', title: 'Favorito del público', description: 'Consigue más del 30% del mercado.', unlocked: history.some((h) => h.marketShare >= 0.3) },
    { id: 'stock', emoji: '📦', title: 'Siempre con stock', description: 'Vende sin perder clientes por falta de stock.', unlocked: Boolean(report && report.operations.lostSales.A + report.operations.lostSales.B === 0) },
    { id: 'growth', emoji: '🏗️', title: 'Visionario', description: 'Amplía tu planta.', unlocked: data.snapshot.capacity + data.snapshot.capacityPending > data.rules.initial.capacity },
    { id: 'investor', emoji: '📈', title: 'Creador de valor', description: 'Tu acción supera su precio inicial en 20%.', unlocked: data.snapshot.sharePrice >= data.rules.initial.shareParValue * 1.2 },
    { id: 'safe', emoji: '🛡️', title: 'Finanzas sanas', description: 'Cierra el trimestre sin préstamo de emergencia.', unlocked: Boolean(report && report.alerts.emergencyLoan === 0) },
  ]
}
