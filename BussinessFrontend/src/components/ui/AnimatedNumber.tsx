import { animate } from 'framer-motion'
import { useEffect, useRef } from 'react'

// Counts up/down to the new value, used in the results reveal and live projections
export function AnimatedNumber({ value, format, duration = 0.8 }: { value: number; format: (value: number) => string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const previous = useRef(0)

  useEffect(() => {
    const controls = animate(previous.current, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (latest) => {
        if (ref.current) ref.current.textContent = format(latest)
      },
    })
    previous.current = value
    return () => controls.stop()
  }, [value, format, duration])

  return <span ref={ref}>{format(value)}</span>
}
