import { motion } from 'framer-motion'

import type { StepId } from '@/lib/constants'
import { money, units } from '@/lib/format'
import type { DecisionValidation, PlayerDashboard } from '@/lib/types'

// Friendly step-by-step guidance for the first cycles; can be turned off with "Modo guiado"
export function CoachBubble({ step, data, validation }: { step: StepId; data: PlayerDashboard; validation: DecisionValidation | null }) {
  const p = validation?.projection
  const avgA = data.industry.at(-1)?.averagePrice.A ?? data.rules.refPrice.A
  const avgB = data.industry.at(-1)?.averagePrice.B ?? data.rules.refPrice.B
  const text: Record<StepId, string> = {
    production: p
      ? `Estimamos que te pedirán unas ${units(p.estimatedDemand.A)} unidades de A y ${units(p.estimatedDemand.B)} de B. Produce algo cercano (la marca en cada barra) y compra materia prima para el próximo trimestre.`
      : 'Decide cuánto fabricar de cada producto y compra materia prima para el próximo trimestre.',
    market: `El precio promedio del mercado fue ${money(avgA)} para A y ${money(avgB)} para B. Bájalo para ganar volumen o súbelo para ganar margen; la publicidad te hace más visible.`,
    research: 'Invertir en calidad es clave para el Producto B: sus clientes la valoran mucho. Para el A importa menos que el precio.',
    finance:
      p && p.estimatedCashEnd < 0
        ? `¡Ojo! Tu caja estimada termina en ${money(p.estimatedCashEnd)}. Pide un préstamo de corto plazo para evitar el de emergencia, que es más caro.`
        : 'Tu caja se ve bien. Si te sobra dinero, puedes invertirlo en valores; si quieres ampliar la planta, un préstamo de largo plazo es lo ideal.',
    review: 'Revisa que no haya nada en rojo y envía. Puedes cambiar tus decisiones hasta que cierre el trimestre.',
  }
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex items-start gap-3 rounded-3xl bg-gradient-to-r from-brand-600 to-fuchsia-500 p-4 text-white shadow-lg">
      <motion.span className="text-3xl" animate={{ rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.8 }}>
        🦉
      </motion.span>
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-yellow-200">Tu asesor</p>
        <p className="mt-0.5 font-bold leading-snug">{text[step]}</p>
      </div>
    </motion.div>
  )
}
