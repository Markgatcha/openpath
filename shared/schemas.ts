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
})
export type AiSettingsInput = z.infer<typeof AiSettingsSchema>
