import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { LogOut, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'

import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { api } from '@/lib/api'
import { session } from '@/lib/session'
import type { GameStatus } from '@/lib/types'

import { CreateGameModal } from './CreateGameModal'

const STATUS: Record<GameStatus, { label: string; className: string }> = {
  LOBBY: { label: 'En sala de espera', className: 'bg-amber-100 text-amber-700' },
  IN_PROGRESS: { label: 'En juego', className: 'bg-emerald-100 text-emerald-700' },
  FINISHED: { label: 'Terminada', className: 'bg-slate-100 text-slate-500' },
}

export function FacilitatorHome() {
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const token = session.facilitatorToken()
  const games = useQuery({ queryKey: ['games'], queryFn: api.listGames, enabled: Boolean(token) })

  if (!token) return <Navigate to="/facilitator/login" replace />

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-bold text-slate-500 sm:inline">Hola, {session.facilitatorName() ?? 'facilitador'}</span>
            <Button
              variant="ghost"
              size="sm"
              icon={<LogOut className="size-4" />}
              onClick={() => {
                session.setFacilitatorToken(null)
                navigate('/facilitator/login')
              }}
            >
              Salir
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black">Tus partidas</h1>
            <p className="font-semibold text-slate-500">Crea una partida, comparte el PIN y controla el ritmo del juego.</p>
          </div>
          <Button size="lg" onClick={() => setCreating(true)} icon={<Plus className="size-5" />}>
            Nueva partida
          </Button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.data?.map((game, index) => (
            <motion.div key={game.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
              <Link to={`/facilitator/games/${game.id}`} className="card block p-5 transition hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-black">{game.name}</h2>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${STATUS[game.status].className}`}>{STATUS[game.status].label}</span>
                </div>
                <p className="mt-3 font-mono text-3xl font-black tracking-widest text-brand-600">{game.pin}</p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  {game.companies} empresas · {game.status === 'LOBBY' ? `${game.totalCycles} trimestres` : `Trimestre ${game.currentCycle}/${game.totalCycles}`} · {game.cycleDurationMinutes} min
                </p>
              </Link>
            </motion.div>
          ))}
          {games.data?.length === 0 && (
            <button onClick={() => setCreating(true)} className="card flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 p-10 text-slate-400 hover:text-brand-600">
              <Plus className="size-8" />
              <span className="font-black">Crea tu primera partida</span>
            </button>
          )}
        </div>
      </main>
      <CreateGameModal open={creating} onClose={() => setCreating(false)} onCreated={(game) => navigate(`/facilitator/games/${game.id}`)} />
    </div>
  )
}
