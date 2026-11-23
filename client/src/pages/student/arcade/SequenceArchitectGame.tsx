import { useCallback, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Reorder } from 'framer-motion'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Flame,
  GripVertical,
  Link2,
  Play,
  Zap,
} from 'lucide-react'
import { Button, Card, Chip } from '@/components/ui'
import { cn } from '@/lib/utils'
import { fireComboBurst, playBurstSound, playHitSound, playMissSound } from '@/lib/sound'
import { seededRng, shuffled } from '@shared/arcade'
import { isComboBurst } from '@shared/economy'
import { CONTENT_PACKS } from '@shared/packs'
import type { ArcadeRunResultDTO } from '@shared/types'
import {
  ArcadePayoutView,
  ArcadeTopBar,
  matchesSubjectFilter,
  useFinishArcadeRun,
} from './arcade-common'

interface SequenceItem {
  id: string
  text: string
  correctPos: number
}

interface SequencePuzzle {
  id: string
  title: string
  subject: string
  prompt: string
  orderedSteps: string[]
  causalNote: string
}

const CURATED_SEQUENCES: SequencePuzzle[] = [
  {
    id: 'bio-mitosis',
    title: 'Stages of Mitotic Cell Division',
    subject: 'Biology',
    prompt: 'Order the 5 stages of eukaryotic cell division from chromatin condensation to cytoplasmic cleavage:',
    orderedSteps: [
      'Prophase — chromatin condenses into sister chromatids; mitotic spindle nucleates',
      'Prometaphase — nuclear envelope fragments; kinetochore microtubules attach',
      'Metaphase — chromosomes align along the equatorial metaphase plate',
      'Anaphase — cohesin proteins cleave and sister chromatids separate toward poles',
      'Telophase & Cytokinesis — nuclear envelopes reform and contractile ring pinches cell',
    ],
    causalNote: 'Spindle attachment must verify tension at the Metaphase checkpoint before separase triggers Anaphase!',
  },
  {
    id: 'bio-krebs-respiration',
    title: 'Aerobic Cellular Respiration Pathway',
    subject: 'Biology',
    prompt: 'Order the metabolic stages converting one glucose molecule into ~30–32 ATP:',
    orderedSteps: [
      'Glycolysis in cytosol splits 6C glucose into two 3C pyruvate molecules (+2 net ATP)',
      'Pyruvate oxidation in mitochondrial matrix forms Acetyl-CoA and releases CO₂',
      'Citric Acid (Krebs) Cycle oxidizes Acetyl-CoA, loading NADH and FADH₂ electron carriers',
      'Electron Transport Chain pumps H⁺ across the inner cristae membrane to O₂',
      'Chemiosmosis drives H⁺ back through ATP Synthase rotor to phosphorylate ADP → ATP',
    ],
    causalNote: 'NADH/FADH₂ from Krebs supply high-energy electrons to build the proton-motive force that turns ATP synthase.',
  },
  {
    id: 'hist-scientific-industrial',
    title: 'Scientific to Digital Revolution Timeline',
    subject: 'History',
    prompt: 'Arrange these transformative technological & historical milestones chronologically:',
    orderedSteps: [
      'Copernicus publishes De revolutionibus proposing a heliocentric solar system (1543)',
      'Newton’s Principia Mathematica unifies terrestrial and celestial mechanics (1687)',
      'Watt’s separate-condenser steam engine powers mechanized factories (1769)',
      'Pasteur & Koch establish the Germ Theory of infectious disease (1860s–1880s)',
      'Bardeen, Brattain & Shockley invent the solid-state transistor at Bell Labs (1947)',
    ],
    causalNote: 'Classical mechanics enabled precision steam engineering, while quantum solid-state physics unlocked semiconductors.',
  },
  {
    id: 'cs-tcp-http',
    title: 'HTTPS Web Request Lifecycle',
    subject: 'Computer Science',
    prompt: 'Sequence the network events from typing a URL to rendering a secure HTTPS response:',
    orderedSteps: [
      'DNS resolver translates domain hostname into the server IP address',
      'TCP 3-way handshake (SYN → SYN-ACK → ACK) opens a reliable byte stream',
      'TLS handshake verifies certificate and negotiates symmetric session keys',
      'Client transmits encrypted HTTP GET request headers',
      'Server returns 200 OK payload and browser constructs the DOM/CSSOM render tree',
    ],
    causalNote: 'IP routing precedes TCP transport, which must settle before TLS encrypts the HTTP application layer.',
  },
  {
    id: 'econ-monetary-policy',
    title: 'Central Bank Interest-Rate Hike Transmission',
    subject: 'Economics',
    prompt: 'Order the macroeconomic causal chain when a central bank raises its policy rate to cool inflation:',
    orderedSteps: [
      'Central bank raises overnight interbank target interest rate',
      'Commercial borrowing rates for mortgages and corporate investment climb',
      'Interest-sensitive consumption C and business investment I slow down',
      'Aggregate demand AD shifts leftward, easing upward pressure on the price level',
    ],
    causalNote: 'Higher real borrowing costs raise the hurdle rate on capital projects, cooling aggregate spending.',
  },
]

function countInversions(items: SequenceItem[]): number {
  let inv = 0
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      if (items[i].correctPos > items[j].correctPos) inv += 1
    }
  }
  return inv
}

export function SequenceArchitectGame() {
  const [searchParams] = useSearchParams()
  const subjectFilter = searchParams.get('subject') ?? 'All'
  const finishRun = useFinishArcadeRun('sequence-architect')

  // Combine curated 4–7 step timelines with `order` questions from CONTENT_PACKS
  const puzzleBank = useMemo<SequencePuzzle[]>(() => {
    const fromPacks: SequencePuzzle[] = []
    CONTENT_PACKS.forEach((pack) => {
      pack.quizzes.forEach((qz, qzIdx) => {
        qz.questions.forEach((q, qIdx) => {
          if (q.type === 'order' && q.options.length >= 4) {
            fromPacks.push({
              id: `pack-${pack.id}-${qzIdx}-${qIdx}`,
              title: qz.title,
              subject: qz.subject,
              prompt: q.prompt,
              orderedSteps: q.correct.map((idx) => q.options[idx]),
              causalNote: q.explanation ?? 'Each stage establishes the precondition for the next.',
            })
          }
        })
      })
    })
    const combined = [...CURATED_SEQUENCES, ...fromPacks]
    const filtered = combined.filter((p) => matchesSubjectFilter(p.subject, subjectFilter))
    return filtered.length >= 4 ? filtered : combined
  }, [subjectFilter])

  const [phase, setPhase] = useState<'ready' | 'playing' | 'checked' | 'done'>('ready')
  const [puzzles, setPuzzles] = useState<SequencePuzzle[]>([])
  const [roundIdx, setRoundIdx] = useState(0)
  const [items, setItems] = useState<SequenceItem[]>([])
  const [inversions, setInversions] = useState<number | null>(null)

  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [comboBursts, setComboBursts] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [score, setScore] = useState(0)
  const [payout, setPayout] = useState<{
    result: ArcadeRunResultDTO | null
    isNewHigh: boolean
  } | null>(null)

  const runStartRef = useRef(0)

  const loadRound = useCallback((puzzle: SequencePuzzle, seed: number) => {
    const rng = seededRng(seed)
    const canonical: SequenceItem[] = puzzle.orderedSteps.map((text, idx) => ({
      id: `${puzzle.id}-step-${idx}`,
      text,
      correctPos: idx,
    }))
    let scrambled = shuffled(canonical, rng)
    // Guarantee board starts with at least 1 inversion
    if (countInversions(scrambled) === 0 && scrambled.length >= 2) {
      scrambled = [scrambled[1], scrambled[0], ...scrambled.slice(2)]
    }
    setItems(scrambled)
    setInversions(null)
    setPhase('playing')
  }, [])

  const startRun = () => {
    const seed = Date.now()
    const rng = seededRng(seed)
    const selected = shuffled(puzzleBank, rng).slice(0, 5)
    setPuzzles(selected)
    setRoundIdx(0)
    setCombo(0)
    setBestCombo(0)
    setComboBursts(0)
    setCorrect(0)
    setAttempts(0)
    setScore(0)
    setPayout(null)
    runStartRef.current = performance.now()
    loadRound(selected[0], seed + 1)
  }

  const moveItem = (index: number, delta: -1 | 1) => {
    const target = index + delta
    if (target < 0 || target >= items.length) return
    const copy = [...items]
    const [moved] = copy.splice(index, 1)
    copy.splice(target, 0, moved)
    setItems(copy)
  }

  const submitOrder = () => {
    const inv = countInversions(items)
    setInversions(inv)
    setAttempts((a) => a + 1)

    if (inv === 0) {
      const nextCombo = combo + 1
      const nextBest = Math.max(bestCombo, nextCombo)
      const burst = isComboBurst(nextCombo)
      const nextBursts = burst ? comboBursts + 1 : comboBursts
      if (burst) {
        playBurstSound()
        fireComboBurst()
      } else {
        playHitSound(nextCombo)
      }
      setCorrect((c) => c + 1)
      setCombo(nextCombo)
      setBestCombo(nextBest)
      setComboBursts(nextBursts)
      setScore((s) => s + 280 + nextCombo * 55)
      setPhase('checked')
    } else {
      playMissSound()
      setCombo(0)
    }
  }

  const nextRound = async () => {
    if (roundIdx + 1 >= puzzles.length) {
      setPhase('done')
      const durationMs = Math.max(1500, Math.round(performance.now() - runStartRef.current))
      const banked = await finishRun({
        score,
        correct,
        attempts,
        bestCombo,
        comboBursts,
        durationMs,
      })
      setPayout(banked)
      return
    }
    const nextIdx = roundIdx + 1
    setRoundIdx(nextIdx)
    loadRound(puzzles[nextIdx], Date.now() + nextIdx)
  }

  const activePuzzle = puzzles[roundIdx] ?? null

  return (
    <div className="flex flex-col gap-5">
      <ArcadeTopBar
        title="Timeline & Sequence Architect"
        subtitle="Drag-and-drop causal cards into chronological or algorithmic order with live inversion feedback"
        badge={<Chip color="emerald">{subjectFilter}</Chip>}
      />

      {phase === 'ready' && (
        <Card className="mx-auto flex max-w-2xl flex-col gap-5 p-7">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-500/15 text-3xl">
              🧬
            </span>
            <div>
              <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
                5-Sequence Causal Architecture Run
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Drag cards vertically (or use the up/down controls) to eliminate every out-of-order
                inversion across historical timelines, cell pathways, and algorithms!
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              0 inversions = Exact Causal Chain! Partial checks report exact inversion count.
            </span>
            <Button onClick={startRun}>
              <Play size={16} /> Start Sequence Run
            </Button>
          </div>
        </Card>
      )}

      {(phase === 'playing' || phase === 'checked') && activePuzzle && (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Chip color="brand">
                Sequence {roundIdx + 1} / {puzzles.length}
              </Chip>
              <Chip color="emerald">{activePuzzle.subject}</Chip>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="inline-flex items-center gap-1 text-amber-500">
                <Flame size={15} /> {combo}×
              </span>
              <span className="inline-flex items-center gap-1 text-brand-500">
                <Zap size={15} /> {score.toLocaleString()}
              </span>
            </div>
          </div>

          <Card className="flex flex-col gap-4 p-6">
            <div>
              <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
                {activePuzzle.title}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {activePuzzle.prompt}
              </p>
            </div>

            <Reorder.Group
              axis="y"
              values={items}
              onReorder={(next) => {
                if (phase === 'playing') setItems(next)
              }}
              className="flex flex-col gap-2.5"
            >
              {items.map((item, idx) => {
                const exactSpot = inversions !== null && item.correctPos === idx
                const adjacentLinked =
                  inversions !== null &&
                  idx > 0 &&
                  items[idx - 1].correctPos + 1 === item.correctPos

                return (
                  <Reorder.Item
                    key={item.id}
                    value={item}
                    dragListener={phase === 'playing'}
                    className="list-none"
                  >
                    {adjacentLinked && (
                      <div className="-mt-2 mb-1 flex items-center justify-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                          <Link2 size={11} /> Causal Link Verified
                        </span>
                      </div>
                    )}
                    <div
                      className={cn(
                        'flex items-center gap-3 rounded-xl border p-3.5 text-sm transition select-none',
                        phase === 'playing' && 'cursor-grab active:cursor-grabbing',
                        inversions === null
                          ? 'border-slate-200 bg-white hover:border-brand-400 dark:border-white/10 dark:bg-ink-800'
                          : exactSpot
                            ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15'
                            : 'border-amber-500/60 bg-amber-500/10',
                      )}
                    >
                      <GripVertical size={16} className="shrink-0 text-slate-400" />
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-500/15 font-mono text-xs font-extrabold text-brand-600 dark:text-brand-300">
                        {idx + 1}
                      </span>
                      <span className="flex-1 font-medium text-slate-800 dark:text-slate-100">
                        {item.text}
                      </span>

                      {phase === 'playing' && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveItem(idx, -1)}
                            disabled={idx === 0}
                            aria-label={`Move step ${idx + 1} up`}
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/70 disabled:opacity-30 dark:hover:bg-white/10"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveItem(idx, 1)}
                            disabled={idx === items.length - 1}
                            aria-label={`Move step ${idx + 1} down`}
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/70 disabled:opacity-30 dark:hover:bg-white/10"
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </Reorder.Item>
                )
              })}
            </Reorder.Group>

            {inversions !== null && inversions > 0 && phase === 'playing' && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs font-semibold text-amber-800 dark:text-amber-200">
                Telemetry: <strong>{inversions}</strong> out-of-order pair inversion
                {inversions === 1 ? '' : 's'} remaining! Green cards are already in their exact
                slot — adjust the amber cards and re-verify.
              </div>
            )}

            {phase === 'checked' && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
                <div className="max-w-xl text-xs text-slate-700 dark:text-slate-200">
                  <strong className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-300">
                    <CheckCircle2 size={14} /> 0 Inversions — Causal Chain Locked!
                  </strong>
                  <p className="mt-1">{activePuzzle.causalNote}</p>
                </div>
                <Button onClick={() => void nextRound()}>
                  {roundIdx + 1 >= puzzles.length ? 'Finish Run' : 'Next Sequence'}{' '}
                  <ArrowRight size={15} />
                </Button>
              </div>
            )}

            {phase === 'playing' && (
              <div className="flex justify-end">
                <Button onClick={submitOrder}>Verify Causal Order</Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {phase === 'done' && (
        <ArcadePayoutView
          mode="sequence-architect"
          title="Causal Architecture Complete!"
          score={score}
          correct={correct}
          attempts={attempts}
          bestCombo={bestCombo}
          comboBursts={comboBursts}
          extraStats={[
            { label: 'Chains Built', value: `${correct} / ${puzzles.length}` },
            { label: 'Submissions', value: String(attempts) },
          ]}
          result={payout?.result ?? null}
          isNewHigh={payout?.isNewHigh ?? false}
          onPlayAgain={startRun}
        />
      )}
    </div>
  )
}

export default SequenceArchitectGame
