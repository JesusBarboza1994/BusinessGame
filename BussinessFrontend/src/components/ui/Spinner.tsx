import { Loader2 } from 'lucide-react'

export function FullScreenLoader({ label = 'Cargando…', stage }: { label?: string; stage?: boolean }) {
  return (
    <div className={stage ? 'stage flex items-center justify-center' : 'flex min-h-screen items-center justify-center'}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-10 animate-spin" />
        <span className="font-bold">{label}</span>
      </div>
    </div>
  )
}
