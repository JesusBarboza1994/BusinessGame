import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'

import { BotBadge } from '@/components/ui/BotBadge'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import type { PlayerDashboard } from '@/lib/types'

export function LobbyScreen({ data, onTutorial }: { data: PlayerDashboard; onTutorial: () => void }) {
  return (
    <div className="stage">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6">
        <Logo light />
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="flex size-28 items-center justify-center rounded-[2rem] bg-white text-6xl shadow-2xl"
            style={{ boxShadow: `0 0 0 6px ${data.company.color}` }}
          >
            {data.company.avatar}
          </motion.div>
          <h1 className="mt-6 text-4xl font-black">{data.company.name}</h1>
          <p className="mt-2 text-lg font-bold text-white/80">¡Estás dentro! Esperando a que el facilitador inicie la partida…</p>
          <div className="mt-3 flex items-center gap-2 text-sm font-bold text-white/70">
            <span className="relative flex size-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex size-3 rounded-full bg-emerald-400" />
            </span>
            {data.game.name} · {data.game.totalCycles} trimestres
          </div>

          <div className="glass mt-10 w-full p-5">
            <p className="text-sm font-black uppercase tracking-widest text-white/70">Empresas en la sala ({data.ranking.length})</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <AnimatePresence>
                {data.ranking.map((entry) => (
                  <motion.span
                    key={entry.companyId}
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 font-black text-slate-800 shadow"
                  >
                    <span className="text-xl">{entry.avatar}</span>
                    {entry.name}
                    {entry.isBot && <BotBadge />}
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-8 rounded-3xl bg-yellow-300/15 p-5 ring-2 ring-yellow-300/40">
            <p className="font-black">💡 Mientras esperas</p>
            <p className="mt-1 text-sm font-semibold text-white/80">Aprende las reglas en 1 minuto. Te dará ventaja en el primer trimestre.</p>
            <Button variant="stage" className="mt-4" onClick={onTutorial} icon={<BookOpen className="size-5" />}>
              ¿Cómo se juega?
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
