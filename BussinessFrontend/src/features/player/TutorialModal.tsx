import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { TUTORIAL_SLIDES } from '@/lib/glossary'

export function TutorialModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [index, setIndex] = useState(0)
  const slide = TUTORIAL_SLIDES[index]
  const last = index === TUTORIAL_SLIDES.length - 1
  const finish = () => {
    setIndex(0)
    onClose()
  }

  return (
    <Modal open={open} onClose={finish}>
      <div className="pt-2 text-center">
        <AnimatePresence mode="wait">
          <motion.div key={index} initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} transition={{ duration: 0.2 }}>
            <motion.div className="mx-auto flex size-24 items-center justify-center rounded-[2rem] bg-brand-100 text-6xl" animate={{ rotate: [0, -6, 6, 0] }} transition={{ duration: 1.2 }}>
              {slide.emoji}
            </motion.div>
            <h2 className="mt-5 text-2xl font-black text-slate-800">{slide.title}</h2>
            <p className="mx-auto mt-3 max-w-sm text-base font-semibold leading-relaxed text-slate-600">{slide.text}</p>
          </motion.div>
        </AnimatePresence>
        <div className="mt-6 flex justify-center gap-1.5">
          {TUTORIAL_SLIDES.map((item, i) => (
            <button key={item.title} onClick={() => setIndex(i)} className={clsx('h-2 rounded-full transition-all', i === index ? 'w-8 bg-brand-600' : 'w-2 bg-slate-200')} aria-label={`Paso ${i + 1}`} />
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          {index > 0 && <Button variant="secondary" onClick={() => setIndex(index - 1)} icon={<ArrowLeft className="size-5" />} />}
          <Button className="flex-1" onClick={() => (last ? finish() : setIndex(index + 1))} icon={last ? undefined : <ArrowRight className="size-5" />}>
            {last ? '¡A jugar!' : 'Siguiente'}
          </Button>
        </div>
        {!last && (
          <button onClick={finish} className="mt-3 text-sm font-bold text-slate-400 hover:text-slate-600">
            Saltar tutorial
          </button>
        )}
      </div>
    </Modal>
  )
}
