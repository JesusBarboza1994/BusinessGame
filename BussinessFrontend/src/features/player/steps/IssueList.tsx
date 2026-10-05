import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { CircleAlert, TriangleAlert } from 'lucide-react'

import type { DecisionIssue } from '@/lib/types'

export function IssueList({ errors, warnings }: { errors: DecisionIssue[]; warnings: DecisionIssue[] }) {
  const items = [...errors, ...warnings]
  return (
    <AnimatePresence initial={false}>
      {items.map((issue) => (
        <motion.div
          key={`${issue.code}-${issue.field}`}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className={clsx(
            'flex items-start gap-2 overflow-hidden rounded-2xl px-3 py-2.5 text-sm font-bold',
            issue.severity === 'error' ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
          )}
        >
          {issue.severity === 'error' ? <CircleAlert className="mt-0.5 size-4 shrink-0" /> : <TriangleAlert className="mt-0.5 size-4 shrink-0" />}
          <span>{issue.message}</span>
        </motion.div>
      ))}
    </AnimatePresence>
  )
}
