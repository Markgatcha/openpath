import { useState } from 'react'
import { Reorder } from 'framer-motion'
import { GripVertical } from 'lucide-react'
import { Button } from '@/components/ui'
import { FigureCanvas } from '@/components/FigureCanvas'
import { cn } from '@/lib/utils'
import type { FigureGeometry } from '@shared/figure'
import type { QuestionType } from '@shared/schemas'

/**
 * The slice of a question the answer widgets actually read. Both
 * StudentQuestionDTO (solo play) and RaceQuestionDTO (live races)
 * satisfy it structurally, so one widget serves both surfaces.
 */
export interface AnswerableQuestion {
  id: string
  type: QuestionType
  options: string[] | null
  figure: FigureGeometry | null
}

/**
 * Answer widgets shared by the solo quiz player and live races.
 * Each owns its input state and is keyed by question id at the call
 * site, so every question starts fresh with no effect-based resets.
 */

// ── Fill-in-the-blank ──────────────────────────────────────────
export function FillAnswer({
  disabled,
  onSubmit,
}: {
  disabled: boolean
  onSubmit: (value: string) => void
}) {
  const [value, setValue] = useState('')
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (value.trim()) onSubmit(value.trim())
      }}
      className="flex gap-2"
    >
      <input
        autoFocus
        className="input"
        placeholder="Type your answer…"
        value={value}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
      />
      <Button type="submit" disabled={disabled || !value.trim()}>
        Submit
      </Button>
    </form>
  )
}

// ── Drag-to-rank ───────────────────────────────────────────────
export function OrderAnswer({
  question,
  disabled,
  onSubmit,
}: {
  question: AnswerableQuestion
  disabled: boolean
  onSubmit: (indices: number[]) => void
}) {
  const options = question.options ?? []
  const [order, setOrder] = useState(options)

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-slate-400">
        Drag to rank — first item at the top, last at the bottom.
      </p>
      <Reorder.Group
        axis="y"
        values={order}
        onReorder={setOrder}
        className="flex flex-col gap-2"
      >
        {order.map((option) => (
          <Reorder.Item
            key={option}
            value={option}
            className={cn(
              'flex cursor-grab items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-sm font-semibold text-slate-800 active:cursor-grabbing',
              'dark:border-white/10 dark:bg-white/5 dark:text-slate-100',
              disabled && 'pointer-events-none opacity-80',
            )}
          >
            <GripVertical size={16} className="text-slate-400" />
            <span className="grid h-6 w-6 place-items-center rounded-md bg-brand-500/15 text-xs font-bold text-brand-600 dark:text-brand-300">
              {order.indexOf(option) + 1}
            </span>
            {option}
          </Reorder.Item>
        ))}
      </Reorder.Group>
      {!disabled && (
        <Button
          className="mt-2 self-start"
          onClick={() => onSubmit(order.map((option) => options.indexOf(option)))}
        >
          Lock in order
        </Button>
      )}
    </div>
  )
}

// ── Figure: numeric entry with tolerance ───────────────────────
export function FigureAnswer({
  question,
  disabled,
  onSubmit,
}: {
  question: AnswerableQuestion
  disabled: boolean
  onSubmit: (value: number) => void
}) {
  const [value, setValue] = useState('')

  return (
    <div className="flex flex-col items-center gap-5">
      {question.figure && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
          <FigureCanvas geometry={question.figure} size={250} />
        </div>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault()
          const parsed = Number(value)
          if (value.trim() !== '' && Number.isFinite(parsed)) onSubmit(parsed)
        }}
        className="flex w-full max-w-xs gap-2"
      >
        <input
          autoFocus
          type="number"
          step="any"
          className="input"
          placeholder="Your answer (number)"
          value={value}
          disabled={disabled}
          onChange={(event) => setValue(event.target.value)}
        />
        <Button type="submit" disabled={disabled || value.trim() === ''}>
          Submit
        </Button>
      </form>
    </div>
  )
}
