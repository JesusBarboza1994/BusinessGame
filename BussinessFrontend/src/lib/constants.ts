import type { BotLevel, BotStrategy, Product } from './types'

export const PRODUCTS: Product[] = ['A', 'B']

export const PRODUCT_INFO: Record<Product, { name: string; tagline: string; emoji: string; color: string; soft: string }> = {
  A: { name: 'Producto A', tagline: 'Económico · para quien busca precio', emoji: '📦', color: '#0ea5e9', soft: 'bg-sky-50 text-sky-700 ring-sky-200' },
  B: { name: 'Producto B', tagline: 'Premium · para quien busca calidad', emoji: '💎', color: '#d946ef', soft: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200' },
}

export const AVATARS = ['🚀', '🦊', '🐼', '🦁', '🐙', '🦄', '🐝', '🐳', '🦉', '🐯', '🌵', '🍕', '⚡', '🎯', '🧠', '🏭', '🛸', '🌈', '🐸', '🦖']

export const COLORS = ['#7c3aed', '#ec4899', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#ef4444', '#14b8a6', '#a855f7']

export const STEP_THEME = {
  production: { color: '#f59e0b', label: 'Producción', emoji: '🏭' },
  market: { color: '#ec4899', label: 'Mercado', emoji: '📣' },
  research: { color: '#06b6d4', label: 'Investigación', emoji: '🔬' },
  finance: { color: '#10b981', label: 'Finanzas', emoji: '💰' },
  review: { color: '#7c3aed', label: 'Revisar', emoji: '✅' },
} as const

export type StepId = keyof typeof STEP_THEME

export const BOT_STRATEGIES: Record<BotStrategy, { label: string; emoji: string; description: string }> = {
  BALANCED: { label: 'Balanceado', emoji: '⚖️', description: 'Precio de mercado, reparte esfuerzos entre A y B.' },
  LOW_COST: { label: 'Bajo costo', emoji: '🏷️', description: 'Precios bajos, apuesta por volumen en el producto A.' },
  PREMIUM: { label: 'Premium', emoji: '💎', description: 'Calidad y publicidad en B, precios altos.' },
  GROWTH: { label: 'Crecimiento', emoji: '🚀', description: 'Mucha publicidad y amplía la planta con deuda.' },
}

export const BOT_LEVELS: Record<BotLevel, { label: string; description: string }> = {
  EASY: { label: 'Fácil', description: 'Decide con mucho ruido y no reacciona al mercado.' },
  NORMAL: { label: 'Normal', description: 'Sigue la demanda y el precio del mercado, cuida su caja.' },
  HARD: { label: 'Difícil', description: 'Ajusta precios según su stock e invierte la caja ociosa.' },
}
