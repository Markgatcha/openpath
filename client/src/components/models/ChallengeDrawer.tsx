import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, HelpCircle, Lightbulb, Lock, Play, RotateCcw, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ModelChallenge, ParamDef, Params } from './shared-types'

export function ParamControl({
  def,
  value,
  disabled,
  onChange,
}: {
  def: ParamDef
  value: number
  disabled?: boolean
  onChange: (value: number) => void
}) {
  if (def.kind === 'choice') {
    return (
      <fieldset disabled={disabled} className={cn(disabled && 'opacity-60')}>
        <legend className="label">{def.label}</legend>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={def.label}>
          {def.choices.map((choice, index) => (
            <button
              key={choice}
              type="button"
              role="radio"
              disabled={disabled}
              aria-checked={value === index}
              onClick={() => onChange(index)}
              className={cn(
                'rounded-lg border px-2.5 py-1 text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                value === index
                  ? 'border-brand-400 bg-brand-500/15 text-brand-700 dark:text-brand-200'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5',
              )}
            >
              {choice}
            </button>
          ))}
        </div>
      </fieldset>
    )
  }
  if (def.kind === 'toggle') {
    return (
      <label
        className={cn(
          'flex cursor-pointer items-center justify-between gap-3 text-sm font-medium text-slate-700 dark:text-slate-200',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        {def.label}
        <input
          type="checkbox"
          disabled={disabled}
          checked={value === 1}
          onChange={(event) => onChange(event.target.checked ? 1 : 0)}
          className="h-4 w-4 accent-brand-500"
        />
      </label>
    )
  }
  const text = def.format ? def.format(value) : `${value}${def.unit ?? ''}`
  return (
    <label className={cn('block', disabled && 'opacity-60')}>
      <span className="label flex justify-between">
        {def.label}
        <span className="font-mono normal-case text-slate-700 dark:text-slate-200">{text}</span>
      </span>
      <input
        type="range"
        disabled={disabled}
        min={def.min}
        max={def.max}
        step={def.step}
        value={value}
        aria-valuetext={text}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-brand-500"
      />
    </label>
  )
}

export type PoePhase = 'predict' | 'manipulate' | 'explain'

export function ChallengeDrawer({
  modelId,
  challenges,
  activeChallengeId,
  params,
  metrics,
  onApplyParams,
  onLockControlsChange,
  onSolved,
}: {
  modelId: string
  challenges: ModelChallenge[]
  activeChallengeId?: string
  params: Params
  metrics: Record<string, number>
  onApplyParams: (next: Params) => void
  onLockControlsChange: (locked: boolean) => void
  onSolved?: (challengeId: string, modelId: string) => void
}) {
  const initialIndex = useMemo(() => {
    if (!activeChallengeId) return 0
    const idx = challenges.findIndex((c) => c.id === activeChallengeId)
    return idx >= 0 ? idx : 0
  }, [challenges, activeChallengeId])

  const [index, setIndex] = useState(initialIndex)
  const [phase, setPhase] = useState<PoePhase>('predict')
  const [selectedPredict, setSelectedPredict] = useState<number | null>(null)
  const [solvedIds, setSolvedIds] = useState<Set<string>>(() => new Set())

  const challenge = challenges[index] ?? challenges[0]

  useEffect(() => {
    if (!activeChallengeId) return
    const idx = challenges.findIndex((c) => c.id === activeChallengeId)
    if (idx >= 0) {
      setIndex(idx)
      setPhase('predict')
      setSelectedPredict(null)
    }
  }, [activeChallengeId, challenges])

  useEffect(() => {
    if (!challenge) return
    onLockControlsChange(phase === 'predict')
    if (phase === 'predict' && challenge.setupParams) {
      onApplyParams(challenge.setupParams)
    }
    return () => onLockControlsChange(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge?.id, phase])

  if (!challenge) return null

  const evalResult = challenge.manipulate
    ? challenge.manipulate.evaluate(params, metrics)
    : { passed: true, feedback: 'Observe the simulation response and check when ready.' }

  const predictionRight = selectedPredict === challenge.predict.correctIndex
  const canRevealExplain = !challenge.manipulate || evalResult.passed

  function selectChallenge(nextIndex: number) {
    setIndex(nextIndex)
    setPhase('predict')
    setSelectedPredict(null)
  }

  function handleLockPrediction() {
    if (selectedPredict === null) return
    setPhase('manipulate')
  }

  function handleCheckAndExplain() {
    if (!canRevealExplain) return
    setPhase('explain')
    setSolvedIds((prev) => {
      if (prev.has(challenge.id)) return prev
      const next = new Set(prev)
      next.add(challenge.id)
      return next
    })
    onSolved?.(challenge.id, modelId)
  }

  return (
    <section
      aria-label="Predict Observe Explain Challenge"
      className="card flex flex-col gap-3 border-brand-400/30 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-brand-500" />
          <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
            Predict → Manipulate → Check
          </h3>
          <span className="chip bg-slate-500/10 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            {solvedIds.size}/{challenges.length} complete
          </span>
        </div>
        {challenges.length > 1 && (
          <div className="flex flex-wrap gap-1" role="tablist" aria-label="Challenges">
            {challenges.map((ch, idx) => (
              <button
                key={ch.id}
                type="button"
                role="tab"
                aria-selected={idx === index}
                onClick={() => selectChallenge(idx)}
                className={cn(
                  'rounded-lg border px-2 py-0.5 text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                  idx === index
                    ? 'border-brand-400 bg-brand-500/15 text-brand-700 dark:text-brand-200'
                    : solvedIds.has(ch.id)
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5',
                )}
              >
                {solvedIds.has(ch.id) ? '✓ ' : ''}#{idx + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Step progress indicator */}
      <ol className="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
        {(['predict', 'manipulate', 'explain'] as PoePhase[]).map((stepName, i) => {
          const active = phase === stepName
          const done =
            (stepName === 'predict' && phase !== 'predict') ||
            (stepName === 'manipulate' && phase === 'explain')
          const label =
            stepName === 'predict'
              ? '1. Predict'
              : stepName === 'manipulate'
                ? '2. Manipulate'
                : '3. Explain'
          return (
            <li
              key={stepName}
              className={cn(
                'rounded-lg border px-2 py-1 text-center transition',
                active
                  ? 'border-brand-400 bg-brand-500/15 text-brand-700 dark:text-brand-200'
                  : done
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 text-slate-400 dark:border-white/10',
              )}
              aria-current={active ? 'step' : undefined}
            >
              {done ? '✓ ' : `${i === 0 && active ? '🔒 ' : ''}`}
              {label}
            </li>
          )
        })}
      </ol>

      <div>
        <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{challenge.title}</div>
        <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
          {challenge.predict.prompt}
        </p>
      </div>

      {phase === 'predict' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-300">
            <Lock size={13} />
            <span>Controls lock while you commit to a prediction first.</span>
          </div>
          <div className="grid gap-1.5 sm:grid-cols-2" role="radiogroup" aria-label="Prediction choices">
            {challenge.predict.options.map((opt, idx) => (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={selectedPredict === idx}
                onClick={() => setSelectedPredict(idx)}
                className={cn(
                  'rounded-xl border px-3 py-2 text-left text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                  selectedPredict === idx
                    ? 'border-brand-400 bg-brand-500/15 text-brand-700 dark:text-brand-200'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5',
                )}
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              disabled={selectedPredict === null}
              onClick={handleLockPrediction}
              className="btn-primary px-4 py-1.5 text-xs disabled:opacity-50"
            >
              <Play size={13} /> Lock Prediction & Unlock Controls
            </button>
          </div>
        </div>
      )}

      {phase === 'manipulate' && (
        <div className="flex flex-col gap-2.5" aria-live="polite">
          {selectedPredict !== null && (
            <div className="rounded-xl bg-slate-500/10 px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
              Your prediction: <strong>{challenge.predict.options[selectedPredict]}</strong>
            </div>
          )}
          {challenge.manipulate && (
            <div
              className={cn(
                'rounded-xl border px-3 py-2.5 text-xs',
                evalResult.passed
                  ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                  : 'border-cyan-400/40 bg-cyan-500/10 text-slate-700 dark:text-slate-200',
              )}
            >
              <p className="font-bold">Test it in the simulation:</p>
              <p className="mt-0.5">{challenge.manipulate.instruction}</p>
              <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[11px] font-semibold">
                {evalResult.passed ? <CheckCircle2 size={13} /> : <HelpCircle size={13} />}
                {evalResult.feedback}
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => selectChallenge(index)}
              className="btn-ghost px-3 py-1.5 text-xs"
            >
              <RotateCcw size={13} /> Re-predict
            </button>
            <button
              type="button"
              disabled={!canRevealExplain}
              onClick={handleCheckAndExplain}
              className="btn-primary px-4 py-1.5 text-xs disabled:opacity-50"
            >
              Check & Reveal Explanation
            </button>
          </div>
        </div>
      )}

      {phase === 'explain' && (
        <div className="flex flex-col gap-2.5" aria-live="polite">
          <div
            className={cn(
              'rounded-xl border px-3 py-2 text-xs font-semibold',
              predictionRight
                ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                : 'border-amber-400/50 bg-amber-500/10 text-amber-800 dark:text-amber-200',
            )}
          >
            {predictionRight
              ? `Spot on! Your prediction ("${challenge.predict.options[selectedPredict ?? 0]}") matched the model.`
              : `Surprise! You predicted "${challenge.predict.options[selectedPredict ?? 0]}", while the model shows "${challenge.predict.options[challenge.predict.correctIndex]}".`}
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-500/5 p-3 text-xs leading-relaxed text-slate-700 dark:border-white/10 dark:text-slate-200">
            <Lightbulb size={15} className="mt-0.5 shrink-0 text-amber-500" />
            <div>
              <p>{challenge.explain}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-slate-400">
                Misconception target: {challenge.misconceptionTag}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => selectChallenge(index)}
              className="btn-ghost px-3 py-1.5 text-xs"
            >
              <RotateCcw size={13} /> Retry Challenge
            </button>
            {index + 1 < challenges.length && (
              <button
                type="button"
                onClick={() => selectChallenge(index + 1)}
                className="btn-primary px-4 py-1.5 text-xs"
              >
                Next Challenge (#{index + 2}) →
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
