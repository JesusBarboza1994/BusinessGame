import { motion } from 'framer-motion'

import type { PlayerDashboard } from '@/lib/types'

const ITEMS = ['🛒', '📦', '💎', '💵', '📈', '🏭']
const RADIUS = 70

export function ProcessingScreen({ data }: { data: PlayerDashboard }) {
  return (
    <div className="stage-bg flex min-h-[calc(100vh-110px)] flex-col items-center justify-center rounded-[2rem] px-4 text-center">
      <div className="relative size-48">
        <motion.div className="absolute inset-0" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}>
          {ITEMS.map((item, index) => {
            const angle = (index / ITEMS.length) * Math.PI * 2
            return (
              <span
                key={item}
                className="absolute text-4xl"
                style={{ left: `calc(50% + ${Math.cos(angle) * RADIUS}px)`, top: `calc(50% + ${Math.sin(angle) * RADIUS}px)`, transform: 'translate(-50%, -50%)' }}
              >
                {item}
              </span>
            )
          })}
        </motion.div>
        <motion.span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl" animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>
          🏪
        </motion.span>
      </div>
      <h2 className="mt-8 text-3xl font-black">El mercado está decidiendo…</h2>
      <p className="mt-2 max-w-md font-semibold text-white/80">
        Los clientes comparan precios, calidad y publicidad de todas las empresas en el trimestre {data.game.currentCycle}.
      </p>
    </div>
  )
}
