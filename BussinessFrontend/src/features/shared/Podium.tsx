import { motion } from 'framer-motion'

import { pct } from '@/lib/format'
import type { RankingEntry } from '@/lib/types'

const HEIGHTS = ['h-44', 'h-32', 'h-24']
const ORDER = [1, 0, 2]
const BG = ['bg-yellow-300 text-yellow-900', 'bg-slate-200 text-slate-700', 'bg-orange-300 text-orange-900']

export function Podium({ ranking }: { ranking: RankingEntry[] }) {
  const top = ranking.slice(0, 3)
  return (
    <div className="flex items-end justify-center gap-3">
      {ORDER.filter((index) => top[index]).map((index) => {
        const entry = top[index]
        return (
          <motion.div
            key={entry.companyId}
            className="flex w-28 flex-col items-center sm:w-36"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 + (2 - index) * 0.5, type: 'spring' }}
          >
            <motion.span className="text-5xl" animate={index === 0 ? { rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] } : undefined} transition={{ repeat: Infinity, duration: 2 }}>
              {entry.avatar}
            </motion.span>
            <p className="mt-1 max-w-full truncate text-center font-black">{entry.name}</p>
            <p className="text-sm font-bold opacity-80">{pct(entry.score)}</p>
            <div className={`mt-2 flex w-full items-start justify-center rounded-t-2xl pt-3 text-4xl font-black ${HEIGHTS[index]} ${BG[index]}`}>{index + 1}</div>
          </motion.div>
        )
      })}
    </div>
  )
}
