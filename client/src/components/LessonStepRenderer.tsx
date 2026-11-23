import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Gamepad2,
  HelpCircle,
  Layers,
  Lightbulb,
  Lock,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Target,
} from 'lucide-react'
import { FillAnswer, FigureAnswer, OrderAnswer } from '@/components/AnswerInputs'
import { FigureCanvas } from '@/components/FigureCanvas'
import { ModelEmbed, readoutRecord, type Readout } from '@/components/models/ModelEmbed'
import { Button, Card, Chip } from '@/components/ui'
import { isTypingTarget, usePrefersReducedMotion } from '@/lib/a11y'
import { cn } from '@/lib/utils'
import {
  buildFigureGeometry,
  computeAnswer,
  figureSeed,
  roundValue,
  sampleFigure,
  toleranceFor,
} from '@shared/figure'
import {
  evaluateModelChallenge,
  type LessonStep,
  type LessonVisualContext,
  type ModelTargetChallenge,
} from '@shared/lessons'
import type { ArcadeMode, Difficulty, QuestionInput } from '@shared/schemas'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const

const ARCADE_META: Record<
  ArcadeMode,
  { route: string; label: string; emoji: string; description: string }
> = {
  'streak-siege': {
    route: '/student/arcade/siege',
    label: 'Streak Siege',
    emoji: '🛡️',
    description: 'FSRS survival blitz over your due cards',
  },
  'speed-match': {
    route: '/student/arcade/match',
    label: 'Speed Match',
    emoji: '⚡',
    description: 'Wire concepts, formulas & diagrams fast',
  },
  'step-detective': {
    route: '/student/arcade/detective',
    label: 'Step Detective',
    emoji: '🕵️',
    description: 'Spot conceptual bugs in worked solutions',
  },
  'sim-sandbox': {
    route: '/student/arcade/sandbox',
    label: 'Simulation Sandbox',
    emoji: '🎯',
    description: 'Hit live simulation tolerance targets',
  },
  'sequence-architect': {
    route: '/student/arcade/sequence',
    label: 'Sequence Architect',
    emoji: '🧬',
    description: 'Order causal steps & timelines',
  },
  'boss-raid': {
    route: '/student/arcade/boss',
    label: 'Boss Raid',
    emoji: '🐉',
    description: 'Turn-based SRS boss encounter',
  },
  'certainty-vault': {
    route: '/student/arcade/vault',
    label: 'Certainty Vault',
    emoji: '🔐',
    description: 'Untimed confidence-calibrated vault unlock',
  },
  'diagram-scout': {
    route: '/student/arcade/scout',
    label: 'Diagram Scout',
    emoji: '🧭',
    description: 'Spatial pin-pointing on 3D & 2D models',
  },
  'cloze-workbench': {
    route: '/student/arcade/cloze',
    label: 'Cloze Workbench',
    emoji: '🧩',
    description: 'Untimed multi-blank proof reconstruction',
  },
  'knowledge-bastion': {
    route: '/student/arcade/bastion',
    label: 'Knowledge Bastion',
    emoji: '🏰',
    description: 'Strategic tower defense powered by mastery',
  },
  'orbit-pilot': {
    route: '/student/arcade/orbit-pilot',
    label: 'Orbit Pilot',
    emoji: '🛰️',
    description: 'Fly a probe to a target orbit on limited fuel',
  },
}

export interface LessonStepResultMeta {
  challengeCompleted?: boolean
  checkpointAttempted?: boolean
  checkpointCorrect?: boolean
  checkpointFirstTry?: boolean
}

export interface LessonStepRendererProps {
  lessonId: string
  packId: string
  step: LessonStep
  stepIndex: number
  totalSteps: number
  stepAlreadyDone: boolean
  linkedQuizId: string | null
  relatedQuizzes?: { id: string; title: string; difficulty: Difficulty; questionCount: number }[]
  nextLessonId: string | null
  enrolledFlashcardCount: number
  justEnrolledCount?: number | null
  savingProgress?: boolean
  onStepComplete: (stepId: string, meta?: LessonStepResultMeta) => void
  onNext: () => void
  onAnnounce?: (text: string) => void
}

// ── Lightweight safe rich-text renderer ────────────────────────
function renderInline(text: string): ReactNode[] {
  const tokens: ReactNode[] = []
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g
  let last = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      tokens.push(text.slice(last, match.index))
    }
    const token = match[0]
    if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push(
        <code
          key={key++}
          className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[0.86em] font-semibold text-brand-700 dark:bg-white/10 dark:text-brand-300"
        >
          {token.slice(1, -1)}
        </code>,
      )
    } else if (token.startsWith('**') && token.endsWith('**')) {
      tokens.push(
        <strong key={key++} className="font-bold text-slate-900 dark:text-white">
          {token.slice(2, -2)}
        </strong>,
      )
    } else if (token.startsWith('*') && token.endsWith('*')) {
      tokens.push(
        <em key={key++} className="italic">
          {token.slice(1, -1)}
        </em>,
      )
    }
    last = pattern.lastIndex
  }
  if (last < text.length) {
    tokens.push(text.slice(last))
  }
  return tokens
}

function RichMarkdown({ text, className }: { text: string; className?: string }) {
  const blocks = useMemo(() => {
    const lines = text.replace(/\r\n/g, '\n').split('\n')
    const out: Array<
      | { kind: 'code'; lang: string; content: string }
      | { kind: 'ul'; items: string[] }
      | { kind: 'ol'; items: string[] }
      | { kind: 'h3'; text: string }
      | { kind: 'p'; text: string }
    > = []

    let i = 0
    while (i < lines.length) {
      const line = lines[i]
      const trimmed = line.trim()

      if (trimmed.startsWith('```')) {
        const lang = trimmed.slice(3).trim()
        const codeLines: string[] = []
        i += 1
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i])
          i += 1
        }
        i += 1
        out.push({ kind: 'code', lang, content: codeLines.join('\n') })
        continue
      }

      if (!trimmed) {
        i += 1
        continue
      }

      if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
        out.push({ kind: 'h3', text: trimmed.replace(/^#{2,3}\s+/, '') })
        i += 1
        continue
      }

      if (/^[-*]\s+/.test(trimmed)) {
        const items: string[] = []
        while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^[-*]\s+/, ''))
          i += 1
        }
        out.push({ kind: 'ul', items })
        continue
      }

      if (/^\d+\.\s+/.test(trimmed)) {
        const items: string[] = []
        while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^\d+\.\s+/, ''))
          i += 1
        }
        out.push({ kind: 'ol', items })
        continue
      }

      const paraLines: string[] = []
      while (
        i < lines.length &&
        lines[i].trim() !== '' &&
        !lines[i].trim().startsWith('```') &&
        !/^[-*]\s+/.test(lines[i].trim()) &&
        !/^\d+\.\s+/.test(lines[i].trim()) &&
        !lines[i].trim().startsWith('##')
      ) {
        paraLines.push(lines[i].trim())
        i += 1
      }
      out.push({ kind: 'p', text: paraLines.join(' ') })
    }
    return out
  }, [text])

  return (
    <div className={cn('flex flex-col gap-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300', className)}>
      {blocks.map((block, idx) => {
        if (block.kind === 'code') {
          return (
            <pre
              key={idx}
              className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-900 p-3.5 font-mono text-xs leading-relaxed text-slate-100 dark:border-white/10"
            >
              {block.lang && (
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {block.lang}
                </span>
              )}
              <code>{block.content}</code>
            </pre>
          )
        }
        if (block.kind === 'h3') {
          return (
            <h3 key={idx} className="font-display text-base font-bold text-slate-900 dark:text-white">
              {renderInline(block.text)}
            </h3>
          )
        }
        if (block.kind === 'ul') {
          return (
            <ul key={idx} className="flex list-disc flex-col gap-1.5 pl-5">
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item)}</li>
              ))}
            </ul>
          )
        }
        if (block.kind === 'ol') {
          return (
            <ol key={idx} className="flex list-decimal flex-col gap-1.5 pl-5">
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item)}</li>
              ))}
            </ol>
          )
        }
        return <p key={idx}>{renderInline(block.text)}</p>
      })}
    </div>
  )
}

// ── Shared Visual Embed helper ─────────────────────────────────
function LessonVisualPanel({
  visual,
  challengeMode = false,
  onChallengeSolved,
  onReadoutSnapshot,
}: {
  visual: LessonVisualContext
  challengeMode?: boolean
  onChallengeSolved?: (challengeId: string, modelId: string) => void
  onReadoutSnapshot?: (readouts: Readout[], params: Record<string, number>) => void
}) {
  if (visual.kind === 'none') return null

  if (visual.kind === 'figure-2d') {
    const geometry = buildFigureGeometry(visual.figure)
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <FigureCanvas geometry={geometry} size={270} />
        {visual.interactiveParams && visual.interactiveParams.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5">
            {visual.interactiveParams.map((paramKey) => {
              const val = visual.figure.givens[paramKey]
              if (val === undefined) return null
              return (
                <span
                  key={paramKey}
                  className="chip bg-brand-500/10 font-mono text-xs text-brand-700 dark:text-brand-300"
                >
                  {paramKey} = {val}
                </span>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <ModelEmbed
      modelId={visual.modelId}
      initialParams={visual.initialParams}
      lockedParams={visual.lockedParams ?? visual.targetChallenge?.lockParams}
      highlightHotspots={visual.highlightHotspots}
      compact
      challengeId={challengeMode ? visual.challengeId : undefined}
      defaultTab={challengeMode && visual.challengeId ? 'challenge' : 'explore'}
      onChallengeSolved={onChallengeSolved}
      onReadoutSnapshot={onReadoutSnapshot}
    />
  )
}

// ── Question grading & misconception lookup helpers ────────────
function normalizeFill(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,!?;:'"]/g, '')
}

function deterministicShuffleOrder(
  options: string[],
  correct: number[],
  seedStr: string,
): { shuffledOptions: string[]; originalIndices: number[] } {
  const n = options.length
  const indices = Array.from({ length: n }, (_, idx) => idx)
  if (n < 2) return { shuffledOptions: [...options], originalIndices: indices }

  let hash = 2166136261
  for (let i = 0; i < seedStr.length; i += 1) {
    hash ^= seedStr.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  let state = hash >>> 0
  const rand = () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  for (let i = n - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    const tmp = indices[i]
    indices[i] = indices[j]
    indices[j] = tmp
  }

  const alreadyMatches = indices.every((origIdx, pos) => origIdx === correct[pos])
  if (alreadyMatches) {
    const swap = indices[0]
    indices[0] = indices[1]
    indices[1] = swap
  }

  return {
    shuffledOptions: indices.map((origIdx) => options[origIdx]),
    originalIndices: indices,
  }
}

function lookupMisconceptionHint(
  question: QuestionInput,
  response: unknown,
  hints?: Record<string, string>,
): string | null {
  if (!hints) return null
  const candidates: string[] = []

  if (question.type === 'mcq' && typeof response === 'number') {
    candidates.push(String(response), `option-${response}`)
    const label = question.options[response]
    if (label) candidates.push(label, normalizeFill(label))
  } else if (question.type === 'truefalse' && typeof response === 'boolean') {
    candidates.push(String(response), response ? '1' : '0')
  } else if (question.type === 'fill' && typeof response === 'string') {
    candidates.push(response.trim(), normalizeFill(response))
  } else if (question.type === 'figure' && typeof response === 'number') {
    candidates.push(String(response), String(Math.round(response * 100) / 100))
  } else if (question.type === 'order' && Array.isArray(response)) {
    candidates.push(response.join(','))
  }

  for (const key of candidates) {
    if (key && hints[key]) return hints[key]
  }
  const normalizedEntries = Object.entries(hints)
  for (const cand of candidates) {
    const normCand = normalizeFill(cand)
    const found = normalizedEntries.find(([k]) => normalizeFill(k) === normCand)
    if (found) return found[1]
  }

  return hints.default ?? hints['*'] ?? hints.general ?? null
}

// ── Shared Interactive Question Card (faded-practice & checkpoint)
function QuestionCheckCard({
  lessonId,
  stepId,
  question,
  misconceptionHints,
  alreadyDone,
  onSolved,
  onNext,
  isLastStep,
  onAnnounce,
}: {
  lessonId: string
  stepId: string
  question: QuestionInput
  misconceptionHints?: Record<string, string>
  alreadyDone: boolean
  onSolved: (meta: LessonStepResultMeta) => void
  onNext: () => void
  isLastStep: boolean
  onAnnounce?: (text: string) => void
}) {
  const [status, setStatus] = useState<'idle' | 'nudge' | 'correct' | 'revealed'>(
    alreadyDone ? 'correct' : 'idle',
  )
  const [attempts, setAttempts] = useState(0)
  const [triedIndices, setTriedIndices] = useState<number[]>([])
  const [nudgeText, setNudgeText] = useState('')
  const [selectedChoice, setSelectedChoice] = useState<number | boolean | null>(null)

  const concreteSpec = useMemo(
    () =>
      question.type === 'figure'
        ? sampleFigure(question.figure, figureSeed(lessonId, stepId))
        : null,
    [question, lessonId, stepId],
  )
  const figureGeometry = useMemo(
    () => (concreteSpec ? buildFigureGeometry(concreteSpec) : null),
    [concreteSpec],
  )

  const orderPrep = useMemo(() => {
    if (question.type !== 'order') return null
    return deterministicShuffleOrder(question.options, question.correct, `${lessonId}:${stepId}`)
  }, [question, lessonId, stepId])

  const submitResponse = useCallback(
    (response: number | boolean | string | number[]) => {
      if (status === 'correct' || status === 'revealed') return

      let isCorrect = false
      let mappedResponse: number | boolean | string | number[] = response

      if (question.type === 'mcq' && typeof response === 'number') {
        isCorrect = response === question.correct
        setSelectedChoice(response)
      } else if (question.type === 'truefalse' && typeof response === 'boolean') {
        isCorrect = response === question.correct
        setSelectedChoice(response)
      } else if (question.type === 'fill' && typeof response === 'string') {
        const accepted = [question.correct, ...(question.alternatives ?? [])]
        const norm = normalizeFill(response)
        isCorrect = accepted.some((ans) => normalizeFill(ans) === norm)
      } else if (question.type === 'order' && Array.isArray(response) && orderPrep) {
        const mapped = response.map((idx) => orderPrep.originalIndices[idx] ?? idx)
        mappedResponse = mapped
        isCorrect =
          mapped.length === question.correct.length &&
          mapped.every((val, i) => val === question.correct[i])
      } else if (question.type === 'figure' && typeof response === 'number' && concreteSpec) {
        const exactKey = computeAnswer(concreteSpec)
        const roundedKey = roundValue(exactKey, concreteSpec.rounding)
        const tol = toleranceFor(concreteSpec.rounding)
        isCorrect =
          Math.abs(response - exactKey) <= tol || Math.abs(response - roundedKey) <= tol
      }

      if (isCorrect) {
        const firstTry = attempts === 0
        setStatus('correct')
        setNudgeText('')
        onAnnounce?.('Correct! Explanation shown below.')
        onSolved({
          checkpointAttempted: true,
          checkpointCorrect: true,
          checkpointFirstTry: firstTry,
        })
        return
      }

      const nextAttempts = attempts + 1
      setAttempts(nextAttempts)
      if (typeof response === 'number' && question.type === 'mcq') {
        setTriedIndices((prev) => (prev.includes(response) ? prev : [...prev, response]))
      }
      const hint =
        lookupMisconceptionHint(question, mappedResponse, misconceptionHints) ??
        'Not quite — check the relationship carefully and try again without penalty.'
      setNudgeText(hint)
      setStatus('nudge')
      onAnnounce?.(`Coaching hint: ${hint}`)
    },
    [status, question, orderPrep, concreteSpec, attempts, misconceptionHints, onSolved, onAnnounce],
  )

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (status === 'correct' || status === 'revealed') return
      if (isTypingTarget(event.target)) return
      if (question.type === 'mcq') {
        const num = Number(event.key)
        if (num >= 1 && num <= question.options.length) {
          event.preventDefault()
          submitResponse(num - 1)
        }
      } else if (question.type === 'truefalse') {
        if (event.key.toLowerCase() === 't') {
          event.preventDefault()
          submitResponse(true)
        } else if (event.key.toLowerCase() === 'f') {
          event.preventDefault()
          submitResponse(false)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [question, status, submitResponse])

  const revealAndPass = () => {
    setStatus('revealed')
    onAnnounce?.('Explanation revealed. You may continue to the next step.')
    onSolved({
      checkpointAttempted: true,
      checkpointCorrect: false,
      checkpointFirstTry: false,
    })
  }

  const solvedOrRevealed = status === 'correct' || status === 'revealed'

  return (
    <div className="flex flex-col gap-4">
      <div className="font-display text-lg font-bold leading-snug text-slate-900 dark:text-white">
        {question.prompt}
      </div>

      {question.type === 'mcq' && (
        <div className="grid gap-2.5 sm:grid-cols-2" role="group" aria-label="Answer choices">
          {question.options.map((opt, idx) => {
            const isCorrectOpt = solvedOrRevealed && idx === question.correct
            const wasTriedWrong = triedIndices.includes(idx) && idx !== question.correct
            const isSelected = selectedChoice === idx
            return (
              <button
                key={idx}
                type="button"
                disabled={solvedOrRevealed}
                onClick={() => submitResponse(idx)}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-3.5 text-left text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                  isCorrectOpt
                    ? 'border-emerald-400 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
                    : wasTriedWrong
                      ? 'border-amber-400/60 bg-amber-500/10 text-amber-800 dark:text-amber-200'
                      : isSelected
                        ? 'border-brand-400 bg-brand-500/10'
                        : 'border-slate-200 bg-white hover:border-brand-400 hover:bg-brand-500/5 dark:border-white/10 dark:bg-white/5 dark:hover:border-brand-400/60',
                )}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                  {LETTERS[idx] ?? idx + 1}
                </span>
                <span className="flex-1 text-slate-800 dark:text-slate-100">{opt}</span>
                {isCorrectOpt && <Check size={16} className="shrink-0 text-emerald-500" />}
              </button>
            )
          })}
        </div>
      )}

      {question.type === 'truefalse' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {[true, false].map((val) => {
            const isRight = solvedOrRevealed && val === question.correct
            return (
              <button
                key={String(val)}
                type="button"
                disabled={solvedOrRevealed}
                onClick={() => submitResponse(val)}
                className={cn(
                  'rounded-xl border p-4 text-center font-display text-base font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                  isRight
                    ? 'border-emerald-400 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200'
                    : val
                      ? 'border-emerald-300/70 bg-emerald-500/5 text-emerald-700 hover:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300'
                      : 'border-rose-300/70 bg-rose-500/5 text-rose-700 hover:bg-rose-500/15 dark:border-rose-500/30 dark:text-rose-300',
                )}
              >
                {val ? '✓ True' : '✗ False'}
              </button>
            )
          })}
        </div>
      )}

      {question.type === 'fill' && (
        <FillAnswer
          key={stepId}
          disabled={solvedOrRevealed}
          onSubmit={(val) => submitResponse(val)}
        />
      )}

      {question.type === 'order' && orderPrep && (
        <OrderAnswer
          key={stepId}
          question={{
            id: stepId,
            type: 'order',
            options: orderPrep.shuffledOptions,
            figure: null,
          }}
          disabled={solvedOrRevealed}
          onSubmit={(indices) => submitResponse(indices)}
        />
      )}

      {question.type === 'figure' && figureGeometry && (
        <FigureAnswer
          key={stepId}
          question={{
            id: stepId,
            type: 'figure',
            options: null,
            figure: figureGeometry,
          }}
          disabled={solvedOrRevealed}
          onSubmit={(val) => submitResponse(val)}
        />
      )}

      {/* Gentle misconception coaching nudge without point penalties */}
      {status === 'nudge' && nudgeText && (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col gap-2 rounded-xl border border-amber-300 bg-amber-500/10 p-4 text-sm dark:border-amber-500/40"
        >
          <div className="flex items-start gap-2.5">
            <Lightbulb size={17} className="mt-0.5 shrink-0 text-amber-500" />
            <div className="flex-1">
              <p className="font-bold text-amber-800 dark:text-amber-200">
                Misconception check (no point penalty — try again!)
              </p>
              <p className="mt-1 text-slate-700 dark:text-slate-200">{nudgeText}</p>
            </div>
          </div>
          {attempts >= 2 && (
            <button
              type="button"
              onClick={revealAndPass}
              className="self-start text-xs font-semibold text-amber-700 underline hover:text-amber-900 dark:text-amber-300"
            >
              Show worked explanation &amp; continue
            </button>
          )}
        </div>
      )}

      {/* Success / reconciliation feedback */}
      {solvedOrRevealed && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'rounded-xl border p-4',
            status === 'correct'
              ? 'border-emerald-300 bg-emerald-500/10 dark:border-emerald-500/40'
              : 'border-brand-300 bg-brand-500/10 dark:border-brand-500/40',
          )}
        >
          <div className="flex items-center gap-2 font-display text-sm font-bold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 size={17} />
            {status === 'correct'
              ? attempts === 0
                ? 'Correct on the first try!'
                : 'Great adjustment — you got it!'
              : 'Explanation revealed'}
          </div>
          {question.explanation && (
            <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              {question.explanation}
            </p>
          )}
          <div className="mt-4 flex justify-end">
            <Button onClick={onNext}>
              {isLastStep ? 'Finish lesson' : 'Continue'} <ArrowRight size={15} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Predict-Observe-Explain Step ───────────────────────────────
function PredictObserveExplainView({
  step,
  alreadyDone,
  onComplete,
  onNext,
  isLastStep,
  onAnnounce,
}: {
  step: Extract<LessonStep, { kind: 'predict-observe-explain' }>
  alreadyDone: boolean
  onComplete: (meta?: LessonStepResultMeta) => void
  onNext: () => void
  isLastStep: boolean
  onAnnounce?: (text: string) => void
}) {
  const [selectedPrediction, setSelectedPrediction] = useState<number | null>(
    alreadyDone ? (step.correctPredictionIndex ?? 0) : null,
  )
  const [predictionLocked, setPredictionLocked] = useState(alreadyDone)
  const [observeDone, setObserveDone] = useState(alreadyDone)
  const [assertionState, setAssertionState] = useState<boolean[]>([])
  const [selectedExplain, setSelectedExplain] = useState<number | null>(
    alreadyDone ? step.correctExplainIndex : null,
  )
  const [explainFeedback, setExplainFeedback] = useState<'idle' | 'retry' | 'solved'>(
    alreadyDone ? 'solved' : 'idle',
  )
  const [explainAttempts, setExplainAttempts] = useState(0)

  const lastAssertionKeyRef = useRef('')

  const targetChallenge: ModelTargetChallenge | undefined =
    step.visual.kind === 'model-2d' || step.visual.kind === 'model-3d'
      ? step.visual.targetChallenge
      : undefined
  const modelChallengeId =
    step.visual.kind === 'model-2d' || step.visual.kind === 'model-3d'
      ? step.visual.challengeId
      : undefined

  const hasAutoTarget = Boolean(targetChallenge)
  const hasEmbeddedChallenge = !hasAutoTarget && Boolean(modelChallengeId)

  const handleReadoutSnapshot = useCallback(
    (readouts: Readout[], params: Record<string, number>) => {
      if (!targetChallenge || !predictionLocked) return
      const res = evaluateModelChallenge(targetChallenge, params, readoutRecord(readouts))
      const key = `${res.passed}:${res.details.map((d) => (d ? '1' : '0')).join('')}`
      if (key !== lastAssertionKeyRef.current) {
        lastAssertionKeyRef.current = key
        setAssertionState(res.details)
        if (res.passed) {
          setObserveDone(true)
          onAnnounce?.('Target condition reached in the simulation! Explanation unlocked.')
        }
      }
    },
    [targetChallenge, predictionLocked, onAnnounce],
  )

  const handleChallengeSolved = useCallback(() => {
    setObserveDone(true)
    onAnnounce?.('Simulation challenge complete! Explanation unlocked.')
  }, [onAnnounce])

  const lockPrediction = () => {
    if (selectedPrediction === null) return
    setPredictionLocked(true)
    onAnnounce?.('Prediction locked. Interactive lab unlocked.')
  }

  const submitExplain = (idx: number) => {
    setSelectedExplain(idx)
    if (idx === step.correctExplainIndex) {
      setExplainFeedback('solved')
      onComplete({ challengeCompleted: true })
      onAnnounce?.('Explanation verified! Review the reconciliation and continue.')
    } else {
      setExplainAttempts((n) => n + 1)
      setExplainFeedback('retry')
      onAnnounce?.('Not quite — compare your choice with the lab behavior above.')
    }
  }

  const stage: 1 | 2 | 3 = !predictionLocked ? 1 : !observeDone ? 2 : 3

  return (
    <div className="flex flex-col gap-5">
      {/* 3-phase progress pills */}
      <ol className="grid grid-cols-3 gap-2 text-xs font-bold" aria-label="Predict Observe Explain stages">
        {[
          { num: 1, label: '1. Predict' },
          { num: 2, label: '2. Observe Lab' },
          { num: 3, label: '3. Explain' },
        ].map((item) => {
          const active = stage === item.num
          const done = stage > item.num || explainFeedback === 'solved'
          return (
            <li
              key={item.num}
              aria-current={active ? 'step' : undefined}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-center transition',
                done
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : active
                    ? 'border-brand-500/50 bg-brand-500/15 text-brand-700 dark:text-brand-200'
                    : 'border-slate-200 text-slate-400 dark:border-white/10',
              )}
            >
              {done ? <Check size={13} /> : item.num === 1 && !predictionLocked ? <Lock size={12} /> : null}
              {item.label}
            </li>
          )
        })}
      </ol>

      {/* Stage 1: Predict */}
      <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-brand-600 dark:text-brand-300">
            Step 1 · Commit to a prediction
          </span>
          {predictionLocked && (
            <Chip color="emerald">
              <Lock size={11} /> Locked
            </Chip>
          )}
        </div>
        <p className="mt-2 font-display text-base font-bold text-slate-900 dark:text-white">
          {step.predictionPrompt}
        </p>

        <div
          className="mt-3 grid gap-2 sm:grid-cols-2"
          role="radiogroup"
          aria-label="Prediction options"
        >
          {step.predictionChoices.map((choice, idx) => {
            const chosen = selectedPrediction === idx
            return (
              <button
                key={idx}
                type="button"
                role="radio"
                aria-checked={chosen}
                disabled={predictionLocked}
                onClick={() => setSelectedPrediction(idx)}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl border p-3 text-left text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                  chosen
                    ? 'border-brand-500 bg-brand-500/15 text-brand-800 dark:text-brand-200'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-200',
                  predictionLocked && !chosen && 'opacity-50',
                )}
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-100 text-xs font-bold text-slate-500 dark:bg-white/10 dark:text-slate-300">
                  {LETTERS[idx] ?? idx + 1}
                </span>
                <span>{choice}</span>
              </button>
            )
          })}
        </div>

        {!predictionLocked && (
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Locking your prediction unlocks the interactive simulation.
            </span>
            <Button disabled={selectedPrediction === null} onClick={lockPrediction}>
              <Lock size={14} /> Lock prediction &amp; unlock lab
            </Button>
          </div>
        )}
      </section>

      {/* Stage 2: Observe / Manipulate */}
      {!predictionLocked ? (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-100/60 px-6 py-12 text-center dark:border-white/15 dark:bg-white/[0.02]"
          aria-live="polite"
        >
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/15 text-brand-500">
            <Lock size={22} />
          </span>
          <h4 className="font-display text-base font-bold text-slate-800 dark:text-white">
            Interactive Lab Locked Until You Predict
          </h4>
          <p className="max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Research shows making an explicit prediction before testing boosts conceptual transfer.
            Pick an option above and click <strong>Lock prediction</strong> to run the simulation.
          </p>
        </div>
      ) : (
        <section className="flex flex-col gap-3 rounded-2xl border border-cyan-500/30 bg-cyan-500/[0.04] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-cyan-600 dark:text-cyan-300">
              Step 2 · Observe &amp; test in the lab
            </span>
            {observeDone && (
              <Chip color="emerald">
                <Check size={11} /> Observation complete
              </Chip>
            )}
          </div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
            {step.observeInstruction}
          </p>

          {targetChallenge && (
            <div
              role="status"
              aria-live="polite"
              className={cn(
                'flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold',
                observeDone
                  ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
                  : 'border-amber-400/40 bg-amber-500/10 text-amber-800 dark:text-amber-200',
              )}
            >
              <span className="flex items-center gap-2">
                <Target size={14} className="shrink-0" />
                <span>Goal: {targetChallenge.instruction}</span>
              </span>
              <span className="font-mono">
                {observeDone
                  ? 'Target reached ✓'
                  : `${assertionState.filter(Boolean).length}/${targetChallenge.assertions.length} conditions`}
              </span>
            </div>
          )}

          <LessonVisualPanel
            visual={step.visual}
            challengeMode={hasEmbeddedChallenge}
            onChallengeSolved={handleChallengeSolved}
            onReadoutSnapshot={handleReadoutSnapshot}
          />

          {!observeDone && !hasAutoTarget && !hasEmbeddedChallenge && (
            <div className="flex justify-end">
              <Button onClick={() => setObserveDone(true)}>
                Observe &amp; Continue <ArrowRight size={15} />
              </Button>
            </div>
          )}
          {!observeDone && hasEmbeddedChallenge && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Complete the <strong>Predict → Manipulate → Check</strong> goal inside the simulation
              panel above to unlock the final explanation.
            </p>
          )}
        </section>
      )}

      {/* Stage 3: Explain & Reconcile */}
      {predictionLocked && observeDone && (
        <section className="flex flex-col gap-3 rounded-2xl border border-brand-500/30 bg-brand-500/[0.04] p-4">
          <span className="text-xs font-bold uppercase tracking-wide text-brand-600 dark:text-brand-300">
            Step 3 · Explain &amp; reconcile
          </span>
          <p className="font-display text-base font-bold text-slate-900 dark:text-white">
            {step.explainPrompt}
          </p>

          <div className="grid gap-2">
            {step.explainOptions.map((opt, idx) => {
              const isSolvedChoice = explainFeedback === 'solved' && idx === step.correctExplainIndex
              const isSelected = selectedExplain === idx
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={explainFeedback === 'solved'}
                  onClick={() => submitExplain(idx)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border p-3.5 text-left text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                    isSolvedChoice
                      ? 'border-emerald-400 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
                      : isSelected && explainFeedback === 'retry'
                        ? 'border-amber-400 bg-amber-500/10 text-amber-800 dark:text-amber-200'
                        : 'border-slate-200 bg-white text-slate-800 hover:border-brand-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-100',
                  )}
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-100 text-xs font-bold text-slate-500 dark:bg-white/10 dark:text-slate-300">
                    {LETTERS[idx] ?? idx + 1}
                  </span>
                  <span className="flex-1">{opt}</span>
                  {isSolvedChoice && <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />}
                </button>
              )
            })}
          </div>

          {explainFeedback === 'retry' && (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col gap-2 rounded-xl border border-amber-300 bg-amber-500/10 p-3.5 text-sm text-amber-800 dark:border-amber-500/40 dark:text-amber-200"
            >
              <p>
                Re-check what changed in the simulation readouts above and try another explanation.
              </p>
              {explainAttempts >= 2 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedExplain(step.correctExplainIndex)
                    setExplainFeedback('solved')
                    onComplete({ challengeCompleted: true })
                  }}
                  className="self-start text-xs font-semibold underline"
                >
                  Show reconciliation &amp; continue
                </button>
              )}
            </div>
          )}

          {explainFeedback === 'solved' && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-xl border border-emerald-300 bg-emerald-500/10 p-4 dark:border-emerald-500/40"
            >
              {selectedPrediction !== null && step.correctPredictionIndex !== undefined && (
                <p className="mb-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  {selectedPrediction === step.correctPredictionIndex
                    ? '✓ Your initial prediction matched the simulation!'
                    : `Prediction reflection: you predicted “${step.predictionChoices[selectedPrediction]}” — noticing why the lab behaved differently strengthens intuition.`}
                </p>
              )}
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                {step.reconcileFeedback}
              </p>
              <div className="mt-4 flex justify-end">
                <Button onClick={onNext}>
                  {isLastStep ? 'Finish lesson' : 'Continue'} <ArrowRight size={15} />
                </Button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

// ── Worked Example Step ────────────────────────────────────────
function WorkedExampleView({
  step,
  onComplete,
  onNext,
  isLastStep,
}: {
  step: Extract<LessonStep, { kind: 'worked-example' }>
  onComplete: () => void
  onNext: () => void
  isLastStep: boolean
}) {
  const reducedMotion = usePrefersReducedMotion()
  const [openWhy, setOpenWhy] = useState<Set<number>>(() => new Set([0]))

  const allOpen = openWhy.size === step.steps.length
  const toggleIdx = (idx: number) => {
    setOpenWhy((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <RichMarkdown text={step.problemMarkdown} />
      </div>

      {step.visual && step.visual.kind !== 'none' && <LessonVisualPanel visual={step.visual} />}

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Step-by-step walkthrough
        </span>
        <button
          type="button"
          onClick={() =>
            setOpenWhy(allOpen ? new Set() : new Set(step.steps.map((_, i) => i)))
          }
          className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300"
        >
          {allOpen ? 'Collapse all “Why?” notes' : 'Expand all “Why?” notes'}
        </button>
      </div>

      <ol className="flex flex-col gap-3">
        {step.steps.map((item, idx) => {
          const isOpen = openWhy.has(idx)
          return (
            <li
              key={idx}
              className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-500/15 text-xs font-bold text-brand-600 dark:text-brand-300">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                      {item.label}
                    </h4>
                    <p className="mt-1 rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs font-semibold text-slate-800 dark:bg-ink-900 dark:text-cyan-200">
                      {item.expressionOrAction}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => toggleIdx(idx)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
                >
                  <HelpCircle size={13} className="text-brand-500" />
                  Why this step?
                  {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={reducedMotion ? false : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={reducedMotion ? undefined : { opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 ml-10 flex items-start gap-2 rounded-xl border border-brand-500/20 bg-brand-500/5 p-3 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                      <Lightbulb size={14} className="mt-0.5 shrink-0 text-gold-500" />
                      <span>{item.whyNote}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          )
        })}
      </ol>

      <div className="flex justify-end">
        <Button
          onClick={() => {
            onComplete()
            onNext()
          }}
        >
          {isLastStep ? 'Finish lesson' : 'Got it — Practice next'} <ArrowRight size={15} />
        </Button>
      </div>
    </div>
  )
}

// ── Branching Scenario Step ────────────────────────────────────
function BranchingScenarioView({
  step,
  alreadyDone,
  onComplete,
  onNext,
  isLastStep,
  onAnnounce,
}: {
  step: Extract<LessonStep, { kind: 'branching-scenario' }>
  alreadyDone: boolean
  onComplete: () => void
  onNext: () => void
  isLastStep: boolean
  onAnnounce?: (text: string) => void
}) {
  const [nodeId, setNodeId] = useState(step.startNodeId)
  const [pickedChoiceIdx, setPickedChoiceIdx] = useState<number | null>(null)
  const [trail, setTrail] = useState<string[]>([])
  const [reachedEnd, setReachedEnd] = useState(alreadyDone)

  const node = step.nodes[nodeId]
  const picked = pickedChoiceIdx !== null && node ? node.choices[pickedChoiceIdx] : null

  const pickChoice = (idx: number) => {
    if (!node) return
    const choice = node.choices[idx]
    if (!choice) return
    setPickedChoiceIdx(idx)
    onAnnounce?.(choice.feedback)
    if (!choice.nextNodeId || !step.nodes[choice.nextNodeId]) {
      setReachedEnd(true)
      onComplete()
    }
  }

  const advanceBranch = () => {
    if (!picked?.nextNodeId || !step.nodes[picked.nextNodeId]) return
    setTrail((prev) => [...prev, picked.label])
    setNodeId(picked.nextNodeId)
    setPickedChoiceIdx(null)
  }

  const restart = () => {
    setNodeId(step.startNodeId)
    setPickedChoiceIdx(null)
    setTrail([])
  }

  if (!node) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-slate-500">Scenario node unavailable.</p>
        <Button onClick={onNext}>Continue</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {trail.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold">Your path:</span>
          {trail.map((item, idx) => (
            <span key={idx} className="chip bg-slate-500/10 text-slate-600 dark:text-slate-300">
              {idx + 1}. {item}
            </span>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <RichMarkdown text={node.promptMarkdown} />
      </div>

      <div className="grid gap-2.5">
        {node.choices.map((choice, idx) => {
          const isPicked = pickedChoiceIdx === idx
          return (
            <button
              key={idx}
              type="button"
              onClick={() => pickChoice(idx)}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-3.5 text-left text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                isPicked
                  ? 'border-brand-500 bg-brand-500/15 text-brand-800 dark:text-brand-200'
                  : 'border-slate-200 bg-white text-slate-800 hover:border-brand-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-100',
              )}
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-100 text-xs font-bold text-slate-500 dark:bg-white/10 dark:text-slate-300">
                {idx + 1}
              </span>
              <span className="flex-1">{choice.label}</span>
            </button>
          )
        })}
      </div>

      {picked && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'rounded-xl border p-4',
            picked.outcome === 'optimal'
              ? 'border-emerald-300 bg-emerald-500/10 dark:border-emerald-500/40'
              : picked.outcome === 'unsafe'
                ? 'border-rose-300 bg-rose-500/10 dark:border-rose-500/40'
                : picked.outcome === 'suboptimal'
                  ? 'border-amber-300 bg-amber-500/10 dark:border-amber-500/40'
                  : 'border-brand-300 bg-brand-500/10 dark:border-brand-500/40',
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            {picked.outcome === 'optimal' && (
              <Chip color="emerald">
                <CheckCircle2 size={12} /> Optimal choice
              </Chip>
            )}
            {picked.outcome === 'suboptimal' && (
              <Chip color="amber">
                <AlertTriangle size={12} /> Suboptimal — trade-off
              </Chip>
            )}
            {picked.outcome === 'unsafe' && (
              <Chip color="rose">
                <ShieldAlert size={12} /> Pitfall / Unsafe
              </Chip>
            )}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            {picked.feedback}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => setPickedChoiceIdx(null)}>
                Try another choice
              </Button>
              {trail.length > 0 && (
                <Button variant="ghost" onClick={restart}>
                  <RotateCcw size={14} /> Restart scenario
                </Button>
              )}
            </div>
            {picked.nextNodeId && step.nodes[picked.nextNodeId] ? (
              <Button onClick={advanceBranch}>
                Follow this branch <ArrowRight size={15} />
              </Button>
            ) : (
              <Button onClick={onNext}>
                {isLastStep ? 'Finish lesson' : 'Continue'} <ArrowRight size={15} />
              </Button>
            )}
          </div>
        </div>
      )}

      {!picked && reachedEnd && (
        <div className="flex justify-end">
          <Button onClick={onNext}>
            {isLastStep ? 'Finish lesson' : 'Continue'} <ArrowRight size={15} />
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Synthesis Step ─────────────────────────────────────────────
function SynthesisView({
  step,
  packId,
  linkedQuizId,
  relatedQuizzes,
  nextLessonId,
  enrolledFlashcardCount,
  justEnrolledCount,
  savingProgress,
}: {
  step: Extract<LessonStep, { kind: 'synthesis' }>
  packId: string
  linkedQuizId: string | null
  relatedQuizzes?: { id: string; title: string; difficulty: Difficulty; questionCount: number }[]
  nextLessonId: string | null
  enrolledFlashcardCount: number
  justEnrolledCount?: number | null
  savingProgress?: boolean
}) {
  const pairedQuiz = useMemo(() => {
    if (relatedQuizzes && relatedQuizzes.length > 0) {
      const idx = step.nextQuizIndex ?? 0
      return relatedQuizzes[idx] ?? relatedQuizzes[0]
    }
    return null
  }, [relatedQuizzes, step.nextQuizIndex])

  const targetQuizId = pairedQuiz?.id ?? linkedQuizId
  const arcadeInfo = step.arcadeLaunch ? ARCADE_META[step.arcadeLaunch.mode] : null
  const arcadePack = step.arcadeLaunch?.packId ?? packId
  const totalEnrolled = Math.max(enrolledFlashcardCount, justEnrolledCount ?? 0)

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-brand-500/10 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-display text-base font-extrabold text-emerald-700 dark:text-emerald-300">
            <Award size={19} /> Lesson Complete — Key Takeaways
          </div>
          <Chip color={savingProgress ? 'amber' : 'emerald'}>
            {savingProgress ? 'Saving mastery…' : 'Progress saved ✓'}
          </Chip>
        </div>

        <ul className="mt-4 flex flex-col gap-2.5">
          {step.takeaways.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-white/80 p-3 text-sm text-slate-800 dark:bg-ink-900/60 dark:text-slate-100"
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-600 dark:text-emerald-300">
                {idx + 1}
              </span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* FSRS Flashcard auto-enrollment banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-300">
            <Layers size={19} />
          </span>
          <div>
            <p className="font-display text-sm font-bold text-slate-900 dark:text-white">
              {totalEnrolled > 0
                ? `${totalEnrolled} spaced-repetition card${totalEnrolled === 1 ? '' : 's'} enrolled in FSRS`
                : step.flashcardEnroll.autoEnroll
                  ? 'Flashcards synced to your spaced-repetition queue'
                  : 'Flashcards ready for practice'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Schedule mode:{' '}
              {step.flashcardEnroll.interleave
                ? 'Interleaved across related concepts'
                : 'Blocked focus deck for targeted retention'}
            </p>
          </div>
        </div>
        <Link to={`/student/flashcards?packId=${encodeURIComponent(packId)}`} className="btn-ghost">
          <Layers size={15} /> Train Flashcards
        </Link>
      </div>

      {/* 1-click launchers */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {targetQuizId && (
          <Link
            to={`/student/play/${targetQuizId}`}
            className="card card-hover flex flex-col justify-between gap-3 border-brand-500/30 bg-brand-500/5 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500/15 text-brand-500">
                <Play size={17} />
              </span>
              {pairedQuiz && (
                <Chip color="brand" className="capitalize">
                  {pairedQuiz.difficulty}
                </Chip>
              )}
            </div>
            <div>
              <h4 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                {pairedQuiz ? pairedQuiz.title : 'Paired Mastery Quiz'}
              </h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Test recall under quiz conditions and earn XP
              </p>
            </div>
            <span className="text-xs font-bold text-brand-600 dark:text-brand-300">
              Launch Quiz →
            </span>
          </Link>
        )}

        <Link
          to={
            arcadeInfo
              ? `${arcadeInfo.route}?pack=${encodeURIComponent(arcadePack)}`
              : `/student/arcade?pack=${encodeURIComponent(packId)}`
          }
          className="card card-hover flex flex-col justify-between gap-3 border-violet-500/30 bg-violet-500/5 p-4"
        >
          <div className="flex items-center justify-between">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/15 text-violet-500">
              <Gamepad2 size={17} />
            </span>
            <span className="text-xl" aria-hidden>
              {arcadeInfo?.emoji ?? '🎮'}
            </span>
          </div>
          <div>
            <h4 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              {arcadeInfo ? arcadeInfo.label : 'Educational Arcade'}
            </h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {arcadeInfo?.description ?? 'Reinforce this topic in the arcade'}
            </p>
          </div>
          <span className="text-xs font-bold text-violet-600 dark:text-violet-300">
            Play Arcade Mode →
          </span>
        </Link>

        {nextLessonId ? (
          <Link
            to={`/student/lessons/${nextLessonId}`}
            className="card card-hover flex flex-col justify-between gap-3 border-emerald-500/30 bg-emerald-500/5 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-500">
                <Compass size={17} />
              </span>
              <Chip color="emerald">Up next</Chip>
            </div>
            <div>
              <h4 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                Continue Curriculum Track
              </h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Advance directly to the next micro-lesson
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-300">
              Next Lesson →
            </span>
          </Link>
        ) : (
          <Link
            to="/student/lessons"
            className="card card-hover flex flex-col justify-between gap-3 p-4"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-500/15 text-slate-600 dark:text-slate-300">
              <BookOpen size={17} />
            </span>
            <div>
              <h4 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                Explore More Tracks
              </h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Browse the curriculum library
              </p>
            </div>
            <span className="text-xs font-bold text-brand-600 dark:text-brand-300">
              Back to Lessons →
            </span>
          </Link>
        )}
      </div>
    </div>
  )
}

// ── Main LessonStepRenderer Component ──────────────────────────
const STEP_KIND_LABEL: Record<LessonStep['kind'], { label: string; color: 'brand' | 'gold' | 'emerald' | 'slate' | 'amber' | 'rose' }> = {
  narrative: { label: 'Concept Hook', color: 'brand' },
  'predict-observe-explain': { label: 'Predict · Observe · Explain', color: 'gold' },
  'worked-example': { label: 'Worked Example', color: 'slate' },
  'faded-practice': { label: 'Guided Practice', color: 'amber' },
  checkpoint: { label: 'Checkpoint', color: 'emerald' },
  'branching-scenario': { label: 'Branching Scenario', color: 'rose' },
  synthesis: { label: 'Synthesis & Launch', color: 'emerald' },
}

export function LessonStepRenderer({
  lessonId,
  packId,
  step,
  stepIndex,
  totalSteps,
  stepAlreadyDone,
  linkedQuizId,
  relatedQuizzes,
  nextLessonId,
  enrolledFlashcardCount,
  justEnrolledCount,
  savingProgress,
  onStepComplete,
  onNext,
  onAnnounce,
}: LessonStepRendererProps) {
  const isLastStep = stepIndex + 1 >= totalSteps
  const metaBadge = STEP_KIND_LABEL[step.kind]

  return (
    <Card className="flex flex-col gap-5 p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-4 dark:border-white/10">
        <div className="flex flex-wrap items-center gap-2">
          <Chip color={metaBadge.color}>
            <Sparkles size={11} />
            {metaBadge.label}
          </Chip>
          <span className="text-xs font-semibold text-slate-400">
            Step {stepIndex + 1} of {totalSteps}
          </span>
        </div>
        {stepAlreadyDone && (
          <Chip color="emerald">
            <Check size={11} /> Completed
          </Chip>
        )}
      </div>

      <h2 className="font-display text-xl font-extrabold text-slate-900 sm:text-2xl dark:text-white">
        {step.title}
      </h2>

      {step.kind === 'narrative' && (
        <div className="flex flex-col gap-5">
          <RichMarkdown text={step.bodyMarkdown} />

          {step.callout && (
            <div
              className={cn(
                'flex items-start gap-3 rounded-2xl border p-4 text-sm',
                step.callout.tone === 'phenomenon'
                  ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-900 dark:text-cyan-100'
                  : step.callout.tone === 'pitfall'
                    ? 'border-amber-400/40 bg-amber-500/10 text-amber-900 dark:text-amber-100'
                    : 'border-brand-400/40 bg-brand-500/10 text-brand-900 dark:text-brand-100',
              )}
            >
              {step.callout.tone === 'pitfall' ? (
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-500" />
              ) : (
                <Lightbulb size={18} className="mt-0.5 shrink-0 text-brand-500" />
              )}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide opacity-80">
                  {step.callout.tone === 'phenomenon'
                    ? 'Anchoring Phenomenon'
                    : step.callout.tone === 'pitfall'
                      ? 'Watch Out — Common Pitfall'
                      : 'Key Idea'}
                </p>
                <p className="mt-1 leading-relaxed">{step.callout.text}</p>
              </div>
            </div>
          )}

          {step.visual && step.visual.kind !== 'none' && <LessonVisualPanel visual={step.visual} />}

          <div className="flex justify-end">
            <Button
              onClick={() => {
                onStepComplete(step.id)
                onNext()
              }}
            >
              {isLastStep ? 'Finish lesson' : 'Continue'} <ArrowRight size={15} />
            </Button>
          </div>
        </div>
      )}

      {step.kind === 'predict-observe-explain' && (
        <PredictObserveExplainView
          step={step}
          alreadyDone={stepAlreadyDone}
          onComplete={(meta) => onStepComplete(step.id, meta)}
          onNext={onNext}
          isLastStep={isLastStep}
          onAnnounce={onAnnounce}
        />
      )}

      {step.kind === 'worked-example' && (
        <WorkedExampleView
          step={step}
          onComplete={() => onStepComplete(step.id)}
          onNext={onNext}
          isLastStep={isLastStep}
        />
      )}

      {step.kind === 'faded-practice' && (
        <div className="flex flex-col gap-5">
          <RichMarkdown text={step.promptMarkdown} />
          {step.completedSteps.length > 0 && (
            <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.02]">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Completed scaffold steps
              </span>
              <ol className="flex flex-col gap-2">
                {step.completedSteps.map((line, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                      <Check size={12} />
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
                <li className="flex items-center gap-2.5 rounded-xl border border-dashed border-brand-400/50 bg-brand-500/5 px-3 py-2 text-xs font-bold text-brand-700 dark:text-brand-300">
                  Your turn — complete the faded step below
                </li>
              </ol>
            </div>
          )}
          <QuestionCheckCard
            lessonId={lessonId}
            stepId={step.id}
            question={step.fadedTarget.question}
            misconceptionHints={step.misconceptionHints}
            alreadyDone={stepAlreadyDone}
            onSolved={(meta) => onStepComplete(step.id, meta)}
            onNext={onNext}
            isLastStep={isLastStep}
            onAnnounce={onAnnounce}
          />
        </div>
      )}

      {step.kind === 'checkpoint' && (
        <QuestionCheckCard
          lessonId={lessonId}
          stepId={step.id}
          question={step.question}
          misconceptionHints={step.misconceptionHints}
          alreadyDone={stepAlreadyDone}
          onSolved={(meta) => onStepComplete(step.id, meta)}
          onNext={onNext}
          isLastStep={isLastStep}
          onAnnounce={onAnnounce}
        />
      )}

      {step.kind === 'branching-scenario' && (
        <BranchingScenarioView
          step={step}
          alreadyDone={stepAlreadyDone}
          onComplete={() => onStepComplete(step.id)}
          onNext={onNext}
          isLastStep={isLastStep}
          onAnnounce={onAnnounce}
        />
      )}

      {step.kind === 'synthesis' && (
        <SynthesisView
          step={step}
          packId={packId}
          linkedQuizId={linkedQuizId}
          relatedQuizzes={relatedQuizzes}
          nextLessonId={nextLessonId}
          enrolledFlashcardCount={enrolledFlashcardCount}
          justEnrolledCount={justEnrolledCount}
          savingProgress={savingProgress}
        />
      )}
    </Card>
  )
}
