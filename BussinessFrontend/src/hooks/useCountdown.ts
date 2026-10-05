import { useEffect, useState } from 'react'

// Seconds left until the deadline, corrected by the server clock offset
export function useCountdown(deadline: string | null | undefined, serverTime?: string): number | null {
  const [offset] = useState(() => (serverTime ? new Date(serverTime).getTime() - Date.now() : 0))
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!deadline) return
    const id = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(id)
  }, [deadline])

  if (!deadline) return null
  return Math.max(0, Math.round((new Date(deadline).getTime() - (now + offset)) / 1000))
}

export const formatClock = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
