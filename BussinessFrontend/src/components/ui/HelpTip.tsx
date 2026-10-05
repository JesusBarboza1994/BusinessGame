import { AnimatePresence, motion } from 'framer-motion'
import { CircleHelp } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export function HelpTip({ text, title }: { text: string; title?: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <span ref={ref} className="relative inline-flex">
      <button
        type="button"
        aria-label="¿Qué es esto?"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-slate-400 transition hover:text-brand-600"
      >
        <CircleHelp className="size-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.span
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 rounded-2xl bg-slate-900 p-3 text-left text-sm font-semibold leading-snug text-white shadow-xl"
          >
            {title && <span className="mb-1 block text-xs font-black uppercase tracking-wide text-brand-300">{title}</span>}
            {text}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
