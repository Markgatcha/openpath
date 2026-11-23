import { z } from 'zod'
import {
  ARCADE_MODES,
  FigureSpecSchema,
  QuestionInputSchema,
  type ArcadeMode,
  type FigureSpec,
  type QuestionInput,
} from './schemas'

// ── Licensing & Attribution ────────────────────────────────────
export const OER_LICENSE_CODES = [
  'MIT',
  'CC0-1.0',
  'PD',
  'CC-BY-4.0',
  'CC-BY-3.0',
  'CC-BY-SA-4.0',
  'CC-BY-SA-3.0',
  'CC-BY-NC-4.0',
  'CC-BY-NC-SA-4.0',
  'CC-BY-NC-ND-4.0',
] as const

export const OerLicenseCodeSchema = z.enum(OER_LICENSE_CODES)
export type OerLicenseCode = z.infer<typeof OerLicenseCodeSchema>

// ── Mastery Progression ────────────────────────────────────────
export const MASTERY_LEVELS = [
  'unstarted',
  'attempted',
  'familiar',
  'proficient',
  'mastered',
] as const

export const MasteryLevelSchema = z.enum(MASTERY_LEVELS)
export type MasteryLevel = z.infer<typeof MasteryLevelSchema>

export const GRADE_BANDS = ['MS', 'HS', 'College-Intro', 'All-Ages'] as const
export const GradeBandSchema = z.enum(GRADE_BANDS)
export type GradeBand = z.infer<typeof GradeBandSchema>

export type TrackSubjectGroup =
  | 'Math'
  | 'Science'
  | 'CS'
  | 'Economics'
  | 'History'
  | 'Languages'

export const TrackSubjectGroupSchema = z.enum([
  'Math',
  'Science',
  'CS',
  'Economics',
  'History',
  'Languages',
])

// ── Embedded Model Challenge Contract ──────────────────────────
export const ModelTargetAssertionSchema = z.object({
  source: z.enum(['param', 'readout']),
  key: z.string().min(1),
  op: z.enum(['eq', 'gte', 'lte', 'approx']),
  target: z.union([z.number(), z.boolean(), z.string()]),
  tolerance: z.number().nonnegative().optional(),
})
export type ModelTargetAssertion = z.infer<typeof ModelTargetAssertionSchema>

export const ModelTargetChallengeSchema = z.object({
  id: z.string().min(1),
  instruction: z.string().min(1),
  lockParams: z.array(z.string().min(1)).optional(),
  assertions: z.array(ModelTargetAssertionSchema).min(1),
})
export type ModelTargetChallenge = z.infer<typeof ModelTargetChallengeSchema>

// ── Lesson Visual Contexts ─────────────────────────────────────
const modelVisualBase = {
  modelId: z.string().min(1),
  initialParams: z.record(z.string(), z.union([z.number(), z.boolean()])).optional(),
  lockedParams: z.array(z.string().min(1)).optional(),
  highlightHotspots: z.array(z.string().min(1)).optional(),
  challengeId: z.string().min(1).optional(),
  targetChallenge: ModelTargetChallengeSchema.optional(),
}

export type LessonVisualContext =
  | {
      kind: 'model-3d' | 'model-2d'
      modelId: string
      initialParams?: Record<string, number | boolean>
      lockedParams?: string[]
      highlightHotspots?: string[]
      challengeId?: string
      targetChallenge?: ModelTargetChallenge
    }
  | {
      kind: 'figure-2d'
      figure: FigureSpec
      interactiveParams?: string[]
    }
  | { kind: 'none' }

export const LessonVisualContextSchema: z.ZodType<LessonVisualContext> = z.discriminatedUnion(
  'kind',
  [
    z.object({ kind: z.literal('model-3d'), ...modelVisualBase }),
    z.object({ kind: z.literal('model-2d'), ...modelVisualBase }),
    z.object({
      kind: z.literal('figure-2d'),
      figure: FigureSpecSchema,
      interactiveParams: z.array(z.string().min(1)).optional(),
    }),
    z.object({ kind: z.literal('none') }),
  ],
)

// ── 5-Step Interactive Micro-Lesson Spine ──────────────────────
const NonEmptyVisualSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('model-3d'), ...modelVisualBase }),
  z.object({ kind: z.literal('model-2d'), ...modelVisualBase }),
  z.object({
    kind: z.literal('figure-2d'),
    figure: FigureSpecSchema,
    interactiveParams: z.array(z.string().min(1)).optional(),
  }),
])

export const LessonStepSchema = z.discriminatedUnion('kind', [
  z.object({
    id: z.string().min(1),
    kind: z.literal('narrative'),
    title: z.string().min(1),
    bodyMarkdown: z.string().min(1),
    callout: z
      .object({
        tone: z.enum(['phenomenon', 'key-idea', 'pitfall']),
        text: z.string().min(1),
      })
      .optional(),
    visual: LessonVisualContextSchema.optional(),
  }),
  z.object({
    id: z.string().min(1),
    kind: z.literal('predict-observe-explain'),
    title: z.string().min(1),
    predictionPrompt: z.string().min(1),
    predictionChoices: z.array(z.string().min(1)).min(2),
    correctPredictionIndex: z.number().int().min(0).optional(),
    visual: NonEmptyVisualSchema,
    observeInstruction: z.string().min(1),
    explainPrompt: z.string().min(1),
    explainOptions: z.array(z.string().min(1)).min(2),
    correctExplainIndex: z.number().int().min(0),
    reconcileFeedback: z.string().min(1),
  }),
  z.object({
    id: z.string().min(1),
    kind: z.literal('worked-example'),
    title: z.string().min(1),
    problemMarkdown: z.string().min(1),
    visual: LessonVisualContextSchema.optional(),
    steps: z
      .array(
        z.object({
          label: z.string().min(1),
          expressionOrAction: z.string().min(1),
          whyNote: z.string().min(1),
        }),
      )
      .min(1),
  }),
  z.object({
    id: z.string().min(1),
    kind: z.literal('faded-practice'),
    title: z.string().min(1),
    promptMarkdown: z.string().min(1),
    completedSteps: z.array(z.string()),
    fadedTarget: z.object({
      type: z.enum(['fill', 'mcq', 'figure', 'order']),
      question: QuestionInputSchema,
    }),
    misconceptionHints: z.record(z.string(), z.string()).optional(),
  }),
  z.object({
    id: z.string().min(1),
    kind: z.literal('checkpoint'),
    title: z.string().min(1),
    question: QuestionInputSchema,
    misconceptionHints: z.record(z.string(), z.string()).optional(),
  }),
  z.object({
    id: z.string().min(1),
    kind: z.literal('branching-scenario'),
    title: z.string().min(1),
    startNodeId: z.string().min(1),
    nodes: z.record(
      z.string(),
      z.object({
        promptMarkdown: z.string().min(1),
        choices: z
          .array(
            z.object({
              label: z.string().min(1),
              nextNodeId: z.string().nullable(),
              feedback: z.string().min(1),
              outcome: z.enum(['optimal', 'suboptimal', 'unsafe']).optional(),
            }),
          )
          .min(1),
      }),
    ),
  }),
  z.object({
    id: z.string().min(1),
    kind: z.literal('synthesis'),
    title: z.string().min(1),
    takeaways: z.array(z.string().min(1)).min(1),
    nextQuizIndex: z.number().int().min(0).optional(),
    arcadeLaunch: z
      .object({
        mode: z.enum(ARCADE_MODES),
        packId: z.string().min(1).optional(),
      })
      .optional(),
    flashcardEnroll: z.object({
      autoEnroll: z.boolean(),
      interleave: z.boolean(),
    }),
  }),
])

export type LessonStep =
  | {
      id: string
      kind: 'narrative'
      title: string
      bodyMarkdown: string
      callout?: { tone: 'phenomenon' | 'key-idea' | 'pitfall'; text: string }
      visual?: LessonVisualContext
    }
  | {
      id: string
      kind: 'predict-observe-explain'
      title: string
      predictionPrompt: string
      predictionChoices: string[]
      correctPredictionIndex?: number
      visual: Exclude<LessonVisualContext, { kind: 'none' }>
      observeInstruction: string
      explainPrompt: string
      explainOptions: string[]
      correctExplainIndex: number
      reconcileFeedback: string
    }
  | {
      id: string
      kind: 'worked-example'
      title: string
      problemMarkdown: string
      visual?: LessonVisualContext
      steps: Array<{
        label: string
        expressionOrAction: string
        whyNote: string
      }>
    }
  | {
      id: string
      kind: 'faded-practice'
      title: string
      promptMarkdown: string
      completedSteps: string[]
      fadedTarget: {
        type: 'fill' | 'mcq' | 'figure' | 'order'
        question: QuestionInput
      }
      misconceptionHints?: Record<string, string>
    }
  | {
      id: string
      kind: 'checkpoint'
      title: string
      question: QuestionInput
      misconceptionHints?: Record<string, string>
    }
  | {
      id: string
      kind: 'branching-scenario'
      title: string
      startNodeId: string
      nodes: Record<
        string,
        {
          promptMarkdown: string
          choices: Array<{
            label: string
            nextNodeId: string | null
            feedback: string
            outcome?: 'optimal' | 'suboptimal' | 'unsafe'
          }>
        }
      >
    }
  | {
      id: string
      kind: 'synthesis'
      title: string
      takeaways: string[]
      nextQuizIndex?: number
      arcadeLaunch?: { mode: ArcadeMode; packId?: string }
      flashcardEnroll: { autoEnroll: boolean; interleave: boolean }
    }

// ── Flashcard Seeds, Lessons, Units & Curriculum Tracks ────────
export const LessonFlashcardSeedSchema = z.object({
  id: z.string().min(1).optional(),
  front: z.string().min(1),
  back: z.string().min(1),
  explanation: z.string().default(''),
  interleave: z.boolean().optional(),
})
export type LessonFlashcardSeed = z.infer<typeof LessonFlashcardSeedSchema>

export interface PackLesson {
  id: string
  unitId: string
  title: string
  summary: string
  estimatedMinutes: number
  standards: string[]
  prerequisiteLessonIds: string[]
  visual?: LessonVisualContext
  steps: LessonStep[]
  flashcardSeeds?: LessonFlashcardSeed[]
}

export const PackLessonSchema: z.ZodType<PackLesson> = z.object({
  id: z.string().min(1),
  unitId: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  estimatedMinutes: z.number().int().min(1).max(120),
  standards: z.array(z.string()),
  prerequisiteLessonIds: z.array(z.string()),
  visual: LessonVisualContextSchema.optional(),
  steps: z.array(LessonStepSchema).min(1),
  flashcardSeeds: z.array(LessonFlashcardSeedSchema).optional(),
})

export const MasteryGateSchema = z.object({
  policy: z.enum(['open', 'soft-recommended', 'teacher-gated']),
  minLessonCompletion: z.boolean(),
  minQuizAccuracyPct: z.number().int().min(0).max(100),
})
export type MasteryGate = z.infer<typeof MasteryGateSchema>

export interface TrackUnit {
  id: string
  title: string
  anchoringPhenomenon: string
  lessons: PackLesson[]
  capstoneQuizIndex?: number
  masteryGate?: MasteryGate
}

export const TrackUnitSchema: z.ZodType<TrackUnit> = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  anchoringPhenomenon: z.string().min(1),
  lessons: z.array(PackLessonSchema),
  capstoneQuizIndex: z.number().int().min(0).optional(),
  masteryGate: MasteryGateSchema.optional(),
})

export interface CurriculumTrack {
  id: string
  slug: string
  packId: string
  title: string
  category: TrackSubjectGroup
  subject: string
  gradeBand: GradeBand
  license: OerLicenseCode
  sourceAttribution: string
  prerequisiteTrackIds: string[]
  srsInterleaveDefault: boolean
  units: TrackUnit[]
}

export const CurriculumTrackSchema: z.ZodType<CurriculumTrack> = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  packId: z.string().min(1),
  title: z.string().min(1),
  category: TrackSubjectGroupSchema,
  subject: z.string().min(1),
  gradeBand: GradeBandSchema,
  license: OerLicenseCodeSchema,
  sourceAttribution: z.string().min(1),
  prerequisiteTrackIds: z.array(z.string()),
  srsInterleaveDefault: z.boolean(),
  units: z.array(TrackUnitSchema),
})

/** Evaluates whether live model params/readouts satisfy a target challenge. */
export function evaluateModelChallenge(
  challenge: ModelTargetChallenge,
  params: Record<string, number | boolean>,
  readouts: Record<string, string | number>,
): { passed: boolean; details: boolean[] } {
  const details = challenge.assertions.map((assertion) => {
    const raw =
      assertion.source === 'param' ? params[assertion.key] : readouts[assertion.key]
    if (raw === undefined) return false

    if (assertion.op === 'eq') {
      if (typeof assertion.target === 'boolean') return Boolean(raw) === assertion.target
      if (typeof assertion.target === 'string') return String(raw).trim() === assertion.target.trim()
      const num = typeof raw === 'number' ? raw : Number.parseFloat(String(raw))
      return Number.isFinite(num) && Math.abs(num - assertion.target) <= (assertion.tolerance ?? 1e-6)
    }

    const num = typeof raw === 'number' ? raw : Number.parseFloat(String(raw))
    const targetNum = typeof assertion.target === 'number' ? assertion.target : Number(assertion.target)
    if (!Number.isFinite(num) || !Number.isFinite(targetNum)) return false

    if (assertion.op === 'gte') return num >= targetNum
    if (assertion.op === 'lte') return num <= targetNum
    return Math.abs(num - targetNum) <= (assertion.tolerance ?? 0.05)
  })
  return { passed: details.every(Boolean), details }
}
