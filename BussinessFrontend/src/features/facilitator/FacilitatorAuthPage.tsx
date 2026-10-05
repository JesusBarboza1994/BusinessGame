import { motion } from 'framer-motion'
import { LogIn, UserPlus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'

import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { api, ApiError } from '@/lib/api'
import { session } from '@/lib/session'

const MESSAGES: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: 'Email o contraseña incorrectos.',
  AUTH_EMAIL_ALREADY_REGISTERED: 'Ese email ya tiene una cuenta. Inicia sesión.',
  VALIDATION_ERROR: 'Revisa los datos: la contraseña necesita al menos 8 caracteres.',
}

export function FacilitatorAuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const result = mode === 'login' ? await api.login({ email, password }) : await api.register({ name, email, password })
      session.setFacilitatorToken(result.token)
      session.setFacilitatorName(result.facilitator.name)
      navigate('/facilitator')
    } catch (err) {
      const apiError = err as ApiError
      setError(MESSAGES[apiError.code] ?? apiError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="stage flex items-center justify-center px-4 py-10">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-md">
        <Link to="/" className="mb-8 flex justify-center">
          <Logo light size="lg" />
        </Link>
        <form onSubmit={submit} className="card space-y-4 p-7 text-slate-800">
          <div>
            <h1 className="text-2xl font-black">{mode === 'login' ? 'Hola de nuevo 👋' : 'Crea tu cuenta de facilitador'}</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">Solo quien crea partidas necesita cuenta. Los jugadores entran con el PIN.</p>
          </div>
          {mode === 'register' && <Field label="Tu nombre" value={name} onChange={setName} autoFocus />}
          <Field label="Email" type="email" value={email} onChange={setEmail} autoFocus={mode === 'login'} />
          <Field label="Contraseña" type="password" value={password} onChange={setPassword} />
          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-600">{error}</p>}
          <Button type="submit" size="lg" className="w-full" loading={loading} icon={mode === 'login' ? <LogIn className="size-5" /> : <UserPlus className="size-5" />}>
            {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </Button>
          <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="w-full text-sm font-bold text-brand-600 hover:underline">
            {mode === 'login' ? '¿Primera vez? Crea una cuenta' : 'Ya tengo cuenta'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', autoFocus }: { label: string; value: string; onChange: (value: string) => void; type?: string; autoFocus?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-extrabold text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-2xl bg-slate-50 px-4 py-3 font-bold outline-none ring-2 ring-slate-200 transition focus:ring-brand-400"
        required
      />
    </label>
  )
}
