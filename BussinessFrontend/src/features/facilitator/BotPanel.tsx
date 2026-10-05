import { useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, ChevronDown, Minus, Plus } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Segmented'
import { api, ApiError } from '@/lib/api'
import { BOT_LEVELS, BOT_STRATEGIES } from '@/lib/constants'
import type { BotLevel, BotStrategy } from '@/lib/types'

type StrategyChoice = BotStrategy | 'MIX'

// Lets the facilitator fill the room with computer-run rivals so small groups still get a real market
export function BotPanel({ gameId }: { gameId: string }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [strategy, setStrategy] = useState<StrategyChoice>('MIX')
  const [level, setLevel] = useState<BotLevel>('NORMAL')
  const [count, setCount] = useState(2)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const add = async () => {
    setAdding(true)
    setError(null)
    try {
      await api.addBots(gameId, { count, level, strategy: strategy === 'MIX' ? undefined : strategy })
      await queryClient.invalidateQueries({ queryKey: ['game', gameId] })
    } catch (err) {
      setError((err as ApiError).message)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="mt-6 rounded-3xl bg-slate-50 ring-1 ring-slate-200">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <span className="flex size-9 items-center justify-center rounded-xl bg-slate-800 text-lg">🤖</span>
        <span className="flex-1">
          <span className="block font-black text-slate-800">Agregar empresas bot</span>
          <span className="block text-xs font-semibold text-slate-500">Rivales automáticos para grupos pequeños o para probar el juego</span>
        </span>
        <ChevronDown className={clsx('size-5 text-slate-400 transition', open && 'rotate-180')} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="space-y-4 px-4 pb-4">
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">Estrategia</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <StrategyCard selected={strategy === 'MIX'} onClick={() => setStrategy('MIX')} emoji="🎲" label="Mezcla" description="Una de cada estrategia, en rotación." />
                  {(Object.keys(BOT_STRATEGIES) as BotStrategy[]).map((key) => (
                    <StrategyCard
                      key={key}
                      selected={strategy === key}
                      onClick={() => setStrategy(key)}
                      emoji={BOT_STRATEGIES[key].emoji}
                      label={BOT_STRATEGIES[key].label}
                      description={BOT_STRATEGIES[key].description}
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">Nivel</p>
                  <Segmented<BotLevel>
                    value={level}
                    onChange={setLevel}
                    options={(Object.keys(BOT_LEVELS) as BotLevel[]).map((key) => ({ value: key, label: BOT_LEVELS[key].label }))}
                  />
                </div>
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">Cantidad</p>
                  <div className="flex items-center gap-1 rounded-2xl bg-white p-1 ring-1 ring-slate-200">
                    <button onClick={() => setCount((c) => Math.max(1, c - 1))} className="flex size-8 items-center justify-center rounded-xl hover:bg-slate-100" aria-label="Menos bots">
                      <Minus className="size-4" />
                    </button>
                    <span className="w-8 text-center text-lg font-black">{count}</span>
                    <button onClick={() => setCount((c) => Math.min(10, c + 1))} className="flex size-8 items-center justify-center rounded-xl hover:bg-slate-100" aria-label="Más bots">
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>
                <Button variant="secondary" className="ml-auto" loading={adding} onClick={add} icon={<Bot className="size-4" />}>
                  Agregar {count} bot{count > 1 ? 's' : ''}
                </Button>
              </div>
              <p className="text-xs font-semibold text-slate-500">
                {BOT_LEVELS[level].description} Los bots deciden solos al cerrar cada trimestre; el trimestre se cierra antes cuando envían todas las personas.
              </p>
              {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-600">{error}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StrategyCard({ selected, onClick, emoji, label, description }: { selected: boolean; onClick: () => void; emoji: string; label: string; description: string }) {
  return (
    <button
      onClick={onClick}
      title={description}
      className={clsx('rounded-2xl p-2.5 text-left transition', selected ? 'bg-slate-800 text-white shadow-lg' : 'bg-white ring-1 ring-slate-200 hover:ring-slate-400')}
    >
      <span className="text-xl">{emoji}</span>
      <span className="block text-sm font-black">{label}</span>
      <span className={clsx('block text-[11px] font-semibold leading-tight', selected ? 'text-white/70' : 'text-slate-500')}>{description}</span>
    </button>
  )
}
