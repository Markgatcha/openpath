import type { Role, QuestionType, Difficulty } from './schemas'
import type { XpProgress } from './game'
import { xpProgress } from './game'

// ── Database rows ─────────────────────────────────────────────
export interface UserRow {
  id: string
  email: string
  name: string
  role: Role
  password_hash: string
  avatar_color: string
  xp: number
  streak_days: number
  streak_last_active: string | null
  daily_goal_minutes: number
  minutes_today: number
  minutes_today_date: string | null
  link_code: string | null
  created_at: string
}

export interface QuizRow {
  id: string
  title: string
  description: string
  subject: string
  difficulty: Difficulty
  teacher_id: string
  classroom_id: string | null
  time_limit_sec: number | null
  published: number
  created_at: string
  updated_at: string
}

export interface QuestionRow {
  id: string
  quiz_id: string
  type: QuestionType
  prompt: string
  options_json: string | null
  correct_json: string
  alternatives_json: string | null
  points: number
  position: number
  explanation: string
  created_at: string
}

export interface AttemptRow {
  id: string
  quiz_id: string
  student_id: string
  score: number
  max_score: number
  xp_earned: number
  correct_count: number
  total_questions: number
  combo_best: number
  duration_sec: number
  created_at: string
  finished_at: string | null
}

export interface AttemptAnswerRow {
  id: string
  attempt_id: string
  question_id: string
  response_json: string
  correct: number
  ms_taken: number
  created_at: string
}

export interface ClassroomRow {
  id: string
  name: string
  subject: string
  teacher_id: string
  join_code: string
  created_at: string
}

export interface BadgeRow {
  id: string
  name: string
  description: string
  icon: string
  condition: string
  sort_order: number
}

// ── DTOs ──────────────────────────────────────────────────────
export interface UserDTO {
  id: string
  email: string
  name: string
  role: Role
  avatarColor: string
  xp: number
  level: number
  xpProgress: XpProgress
  streakDays: number
  dailyGoalMinutes: number
  linkCode: string | null
  createdAt: string
}

export function toUserDTO(row: UserRow): UserDTO {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    avatarColor: row.avatar_color,
    xp: row.xp,
    level: xpProgress(row.xp).level,
    xpProgress: xpProgress(row.xp),
    streakDays: row.streak_days,
    dailyGoalMinutes: row.daily_goal_minutes,
    linkCode: row.link_code,
    createdAt: row.created_at,
  }
}

export interface QuizDTO {
  id: string
  title: string
  description: string
  subject: string
  difficulty: Difficulty
  timeLimitSec: number | null
  published: boolean
  questionCount: number
  teacherName: string
  classroomName: string | null
  createdAt: string
  updatedAt: string
  attemptCount: number
  myBestScore: number | null
}

export interface TeacherQuestionDTO {
  id: string
  type: QuestionType
  prompt: string
  options: string[] | null
  correct: unknown
  alternatives: string[]
  points: number
  position: number
  explanation: string
}

export interface StudentQuestionDTO {
  id: string
  type: QuestionType
  prompt: string
  options: string[] | null
  points: number
  position: number
}

export interface AnswerResultDTO {
  questionId: string
  correct: boolean
  correctAnswer: unknown
  explanation: string
  points: number
  earnedPoints: number
  combo: number
}

export interface AttemptSummaryDTO {
  id: string
  quizId: string
  quizTitle: string
  subject: string
  score: number
  maxScore: number
  accuracy: number
  xpEarned: number
  correctCount: number
  totalQuestions: number
  comboBest: number
  durationSec: number
  finishedAt: string | null
  createdAt: string
}

export interface AttemptFinishDTO {
  attempt: AttemptSummaryDTO
  xpEarned: number
  newLevel: number | null
  streakDays: number
  newBadges: { id: string; name: string; description: string; icon: string }[]
  breakdown: AnswerResultDTO[]
  comboBest: number
  avgMs: number
}

export interface BadgeDTO {
  id: string
  name: string
  description: string
  icon: string
  earned: boolean
  earnedAt: string | null
}

export interface LeaderboardEntryDTO {
  rank: number
  userId: string
  name: string
  avatarColor: string
  xp: number
  level: number
  streakDays: number
  isMe: boolean
}

export interface ClassroomDTO {
  id: string
  name: string
  subject: string
  joinCode: string
  memberCount: number
  quizCount: number
  createdAt: string
}

export interface StudentSummaryDTO {
  id: string
  name: string
  avatarColor: string
  xp: number
  level: number
  streakDays: number
  lastActive: string | null
  minutesToday: number
  dailyGoalMinutes: number
  attemptsThisWeek: number
  avgAccuracy: number
  isLinked: boolean
}

export interface ChildDetailDTO {
  student: UserDTO
  summary: StudentSummaryDTO
  recentAttempts: AttemptSummaryDTO[]
  subjectAccuracy: { subject: string; accuracy: number; attempts: number }[]
  weakQuestions: { prompt: string; quizTitle: string; wrongCount: number; seenCount: number }[]
  weeklyMinutes: { day: string; minutes: number }[]
  badges: BadgeDTO[]
}

export interface StudentDashboardDTO {
  user: UserDTO
  minutesToday: number
  dailyGoalMinutes: number
  attemptsToday: number
  recommended: QuizDTO[]
  classroomQuizzes: QuizDTO[]
  recentAttempts: AttemptSummaryDTO[]
  earnedBadges: BadgeDTO[]
  weeklyMinutes: { day: string; minutes: number }[]
  myRank: number | null
}

export interface QuizAnalyticsDTO {
  quiz: QuizDTO
  attempts: {
    id: string
    studentName: string
    score: number
    maxScore: number
    accuracy: number
    durationSec: number
    finishedAt: string | null
  }[]
  questionStats: {
    questionId: string
    prompt: string
    type: QuestionType
    seenCount: number
    correctCount: number
    accuracy: number
  }[]
  avgScore: number
  completionCount: number
}

export interface AiStatusDTO {
  configured: boolean
  provider: 'openrouter' | 'local'
  baseUrl: string
  model: string
  hasKey: boolean
  source: 'env' | 'app-settings'
}

export interface AiQuestionDraft {
  type: 'mcq' | 'truefalse' | 'fill'
  prompt: string
  options?: string[]
  correct: number | boolean | string
  alternatives?: string[]
  explanation?: string
  points?: number
}
