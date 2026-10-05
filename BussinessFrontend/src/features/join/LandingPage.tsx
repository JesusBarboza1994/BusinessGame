import { motion } from 'framer-motion'
import { ArrowRight, GraduationCap } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { PinInput } from '@/components/ui/PinInput'
import { session } from '@/lib/session'

const FLOATING = ['📦', '💎', '📈', '🏭', '💰', '🛒', '🏆', '📣']

export function LandingPage() {
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const hasSession = Boolean(session.playerToken())
  const go = (code: string) => navigate(`/join?pin=${code}`)

  return (
    <div className="stage relative overflow-hidden">
      {FLOATING.map((emoji, index) => (
        <span
          key={emoji}
          className="pointer-events-none absolute animate-float select-none text-4xl opacity-30 sm:text-6xl"
          style={{ left: `${(index * 13 + 5) % 95}%`, top: `${(index * 29 + 10) % 85}%`, animationDelay: `${index * 0.7}s` }}
        >
          {emoji}
        </span>
      ))}
      <div className="relative mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 py-10 text-center">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <Logo light size="lg" />
        </motion.div>
        <motion.h1
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-8 text-4xl font-black leading-tight sm:text-5xl"
        >
          Dirige tu empresa.
          <br />
          <span className="text-yellow-300">Gánale al mercado.</span>
        </motion.h1>
        <p className="mt-4 max-w-md text-lg font-semibold text-white/80">
          Un simulador de negocios por trimestres. Produce, vende, invierte y compite contra tus compañeros.
        </p>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="glass mt-10 w-full p-6 sm:p-8">
          <p className="mb-4 text-sm font-black uppercase tracking-widest text-white/70">Ingresa el PIN de la partida</p>
          <PinInput value={pin} onChange={setPin} onComplete={go} autoFocus />
          <Button variant="stage" size="lg" className="mt-6 w-full" disabled={pin.length !== 6} onClick={() => go(pin)} icon={<ArrowRight className="size-5" />}>
            Entrar
          </Button>
          {hasSession && (
            <button onClick={() => navigate('/play')} className="mt-4 text-sm font-bold text-yellow-200 underline-offset-4 hover:underline">
              Continuar con mi empresa →
            </button>
          )}
        </motion.div>

        <Link to="/facilitator" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-white/70 hover:text-white">
          <GraduationCap className="size-4" /> Soy facilitador: crear una partida
        </Link>
      </div>
    </div>
  )
}
