import { useEffect } from 'react'

export function useDebouncedEffect(effect: () => void, deps: unknown[], delay: number): void {
  useEffect(() => {
    const id = window.setTimeout(effect, delay)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay])
}
