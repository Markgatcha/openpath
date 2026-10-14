import { z } from 'zod'

// ── Roles & enums ──────────────────────────────────────────────
export const ROLES = ['student', 'teacher', 'parent'] as const
export const RoleSchema = z.enum(ROLES)
export type Role = z.infer<typeof RoleSchema>

export const QUESTION_TYPES = ['mcq', 'truefalse', 'fill', 'order', 'figure'] as const
export const QuestionTypeSchema = z.enum(QUESTION_TYPES)
export type QuestionType = z.infer<typeof QuestionTypeSchema>

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const
export const DifficultySchema = z.enum(DIFFICULTIES)
export type Difficulty = z.infer<typeof DifficultySchema>

// ── Cosmetic paints (used by profile updates and the shop) ────
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/)

const paintSchema = z.union([
  z.object({ type: z.literal('solid'), color: hexColor }),
  z.object({
    type: z.literal('gradient'),
    from: hexColor,
    to: hexColor,
    direction: z.enum([
      'south-north',
      'north-south',
      'west-east',
      'east-west',
      'diagonal',
    ]),
  }),
])

const nameplateSchema = z.union([
  paintSchema,
  z.object({
    type: z.literal('image'),
    image: z.string().min(1).max(400_000),
  }),
])

export const CosmeticsSchema = z.object({
  background: paintSchema,
  nameStyle: paintSchema,
  font: z.string().max(60).nullable().default(null),
  nameplate: nameplateSchema.nullable().default(null),
})
export type CosmeticsInput = z.infer<typeof CosmeticsSchema>

// ── Auth ──────────────────────────────────────────────────────
export const RegisterSchema = z.object({
  email: z.string().email().max(200),
  name: z.string().min(2).max(60),
  password: z.string().min(8).max(100),
  role: RoleSchema,
})
export type RegisterInput = z.infer<typeof RegisterSchema>

export const LoginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(100),
})
export type LoginInput = z.infer<typeof LoginSchema>

export const ProfileUpdateSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  avatarColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  dailyGoalMinutes: z.number().int().min(5).max(240).optional(),
  cosmetics: CosmeticsSchema.optional(),
})
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>

// ── Questions ─────────────────────────────────────────────────
const pointsField = z.number().int().min(1).max(100).default(10)
const explanationField = z.string().max(500).default('')

export const FigureSpecSchema = z.object({
  template: z.enum([
    'triangle-sas',
    'triangle-sss',
    'triangle-asa',
    'right-triangle',
    'circle',
    'trapezoid',
  ]),
  givens: z.record(z.string(), z.number()),
  ask: z.string().min(1).max(30),
  rounding: z.enum(['integer', 'tenth', 'hundredth', 'thousandth', 'exact']),
})
export type FigureSpec = z.infer<typeof FigureSpecSchema>

export const QuestionInputSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('mcq'),
    prompt: z.string().min(3).max(500),
    options: z.array(z.string().min(1).max(200)).min(2).max(6),
    correct: z.number().int().min(0),
    points: pointsField,
    explanation: explanationField,
  }),
  z.object({
    type: z.literal('truefalse'),
    prompt: z.string().min(3).max(500),
    correct: z.boolean(),
    points: pointsField,
    explanation: explanationField,
  }),
  z.object({
    type: z.literal('fill'),
    prompt: z.string().min(3).max(500),
    correct: z.string().min(1).max(200),
    alternatives: z.array(z.string().min(1).max(200)).max(6).default([]),
    points: pointsField,
    explanation: explanationField,
  }),
  z.object({
    type: z.literal('order'),
    prompt: z.string().min(3).max(500),
    options: z.array(z.string().min(1).max(200)).min(2).max(8),
    correct: z.array(z.number().int().min(0)).min(2).max(8),
    points: pointsField,
    explanation: explanationField,
  }),
  z.object({
    type: z.literal('figure'),
    prompt: z.string().min(3).max(500),
    figure: FigureSpecSchema,
    points: pointsField,
    explanation: explanationField,
  }),
])
export type QuestionInput = z.infer<typeof QuestionInputSchema>

// ── Quizzes ───────────────────────────────────────────────────
export const QuizCreateSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(1000).default(''),
  subject: z.string().min(2).max(60),
  difficulty: DifficultySchema.default('medium'),
  kind: z.enum(['homework', 'classwork', 'quiz', 'test']).default('quiz'),
  timeLimitSec: z.number().int().min(0).max(7200).nullable().default(null),
  classroomId: z.string().nullable().default(null),
})
export type QuizCreateInput = z.infer<typeof QuizCreateSchema>

export const QuizUpdateSchema = QuizCreateSchema.partial()
export type QuizUpdateInput = z.infer<typeof QuizUpdateSchema>

export const ReorderSchema = z.object({
  questionIds: z.array(z.string().min(1)).min(1),
})

// ── Attempts ──────────────────────────────────────────────────
export const StartAttemptSchema = z.object({
  quizId: z.string().min(1),
})
export type StartAttemptInput = z.infer<typeof StartAttemptSchema>

export const AttemptAnswerSchema = z.object({
  questionId: z.string().min(1),
  response: z.union([
    z.number(),
    z.boolean(),
    z.string(),
    z.array(z.number()),
  ]),
  msTaken: z.number().int().min(0).max(3600000),
})
export type AttemptAnswerInput = z.infer<typeof AttemptAnswerSchema>

// ── Classrooms & parent links ─────────────────────────────────
export const ClassroomCreateSchema = z.object({
  name: z.string().min(2).max(80),
  subject: z.string().min(2).max(60).default('General'),
})
export type ClassroomCreateInput = z.infer<typeof ClassroomCreateSchema>

export const JoinClassroomSchema = z.object({
  code: z.string().min(4).max(16),
})
export type JoinClassroomInput = z.infer<typeof JoinClassroomSchema>

export const LinkChildSchema = z.object({
  code: z.string().min(4).max(32),
})
export type LinkChildInput = z.infer<typeof LinkChildSchema>

// ── Spaced repetition ─────────────────────────────────────────
export const SrsReviewSchema = z.object({
  questionId: z.string().min(1),
  grade: z.enum(['again', 'hard', 'good', 'easy']),
})
export type SrsReviewInput = z.infer<typeof SrsReviewSchema>

// ── Assignments ───────────────────────────────────────────────
const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .nullable()
  .default(null)

export const AssignmentCreateSchema = z
  .object({
    quizId: z.string().min(1),
    classroomId: z.string().min(1).nullable().default(null),
    studentId: z.string().min(1).nullable().default(null),
    title: z.string().max(120).default(''),
    dueDate: dateField,
    availableFrom: dateField,
    maxAttempts: z.number().int().min(0).max(20).default(0),
  })
  .refine((data) => Boolean(data.classroomId || data.studentId), {
    message: 'Assign to a classroom or to a student',
  })
export type AssignmentCreateInput = z.infer<typeof AssignmentCreateSchema>

// Updates are field-by-field: omitted keys stay as they are. Defined
// explicitly because zod refuses .partial() on a refined object.
export const AssignmentUpdateSchema = z.object({
  classroomId: z.string().min(1).nullable().optional(),
  studentId: z.string().min(1).nullable().optional(),
  title: z.string().max(120).optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
    .nullable()
    .optional(),
  availableFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
    .nullable()
    .optional(),
  maxAttempts: z.number().int().min(0).max(20).optional(),
})
export type AssignmentUpdateInput = z.infer<typeof AssignmentUpdateSchema>

// ── Content packs ─────────────────────────────────────────────
export const PackInstallSchema = z.object({
  packId: z.string().min(1).max(60),
  confirmDuplicates: z.boolean().default(false),
})
export type PackInstallInput = z.infer<typeof PackInstallSchema>

// ── Import / export ───────────────────────────────────────────
export const QtiImportSchema = z.object({
  quizId: z.string().min(1),
  xml: z.string().min(20).max(2_000_000),
})
export type QtiImportInput = z.infer<typeof QtiImportSchema>

export const BackupRestoreSchema = z.object({
  backup: z.object({
    format: z.literal('openpath-backup'),
    version: z.number().int().min(1).max(1),
    exportedAt: z.string().optional(),
    user: z.object({ name: z.string(), email: z.string() }).optional(),
    quizzes: z.array(z.unknown()),
    assignments: z.array(z.unknown()).optional(),
  }),
})
export type BackupRestoreInput = z.infer<typeof BackupRestoreSchema>

// ── Classroom economy ─────────────────────────────────────────
export const EconomySettingsSchema = z.object({
  currencyName: z.string().min(1).max(40),
  currencyIcon: z.string().min(1).max(8),
  pointsPerCoin: z.number().int().min(1).max(1000),
})
export type EconomySettingsInput = z.infer<typeof EconomySettingsSchema>

export const LevelRewardSchema = z.object({
  level: z.number().int().min(2).max(100),
  rewardType: z.enum(['coins', 'item']),
  coins: z.number().int().min(0).max(100000).default(0),
  itemId: z.string().min(1).nullable().default(null),
})
export type LevelRewardInput = z.infer<typeof LevelRewardSchema>

export const LevelRewardsSchema = z.object({
  rewards: z.array(LevelRewardSchema).max(50),
})
export type LevelRewardsInput = z.infer<typeof LevelRewardsSchema>

export const ShopItemCreateSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(300).default(''),
  category: z.enum(['background', 'nameplate', 'name-style', 'font']),
  price: z.number().int().min(0).max(100000),
  itemData: z.union([
    paintSchema,
    z.object({ font: z.string().min(1).max(60) }),
  ]),
})
export type ShopItemCreateInput = z.infer<typeof ShopItemCreateSchema>

export const ShopItemUpdateSchema = ShopItemCreateSchema.partial().extend({
  active: z.boolean().optional(),
})
export type ShopItemUpdateInput = z.infer<typeof ShopItemUpdateSchema>

// ── AI ────────────────────────────────────────────────────────
export const AI_GENERATABLE_TYPES = ['mcq', 'truefalse', 'fill'] as const
export const AiGeneratableTypeSchema = z.enum(AI_GENERATABLE_TYPES)
export type AiGeneratableType = z.infer<typeof AiGeneratableTypeSchema>

export const AiGenerateSchema = z.object({
  topic: z.string().min(3).max(300),
  subject: z.string().max(60).default('General'),
  count: z.number().int().min(1).max(12).default(5),
  difficulty: DifficultySchema.default('medium'),
  types: z.array(AiGeneratableTypeSchema).min(1).default(['mcq', 'truefalse', 'fill']),
})
export type AiGenerateInput = z.infer<typeof AiGenerateSchema>

export const AiSettingsSchema = z.object({
  provider: z.enum(['openrouter', 'local']),
  baseUrl: z.string().url().max(300),
  model: z.string().min(1).max(120),
  apiKey: z.string().max(300).optional(),
  /** Master kill switch; absent means "leave on". */
  enabled: z.boolean().default(true),
})
export type AiSettingsInput = z.infer<typeof AiSettingsSchema>
