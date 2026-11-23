import type { Role, QuestionType, Difficulty, FigureSpec, RaceMode } from './schemas'
import type { XpProgress } from './game'
import type { FigureGeometry } from './figure'
import type { Cosmetics, Paint, Nameplate, QuizKind } from './economy'
import type { SrsState } from './srs'
import type { Confidence, ConfidenceSummary } from './confidence'
import type {
  GradeBand,
  MasteryGate,
  MasteryLevel,
  OerLicenseCode,
  PackLesson,
  TrackSubjectGroup,
} from './lessons'
import { DEFAULT_COSMETICS } from './economy'
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
  coins: number
  cosmetics_json: string | null
  created_at: string
}

export interface QuizRow {
  id: string
  title: string
  description: string
  subject: string
  difficulty: Difficulty
  kind: QuizKind
  teacher_id: string
  classroom_id: string | null
  time_limit_sec: number | null
  published: number
  pack_id?: string | null
  model_id?: string | null
  standards?: string | null
  lesson_id?: string | null
  srs_interleave?: number
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
  /** JSON map of questionId → sampled figure variant (see server/lib/variants.ts). */
  variants_json: string | null
}

export interface AttemptAnswerRow {
  id: string
  attempt_id: string
  question_id: string
  response_json: string
  correct: number
  ms_taken: number
  /** Optional self-rating (see shared/confidence.ts); null = untagged. */
  confidence: string | null
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
  coins: number
  cosmetics: Cosmetics
  createdAt: string
}

export function toUserDTO(row: UserRow): UserDTO {
  let cosmetics: Cosmetics = DEFAULT_COSMETICS
  if (row.cosmetics_json) {
    try {
      cosmetics = { ...DEFAULT_COSMETICS, ...(JSON.parse(row.cosmetics_json) as Cosmetics) }
    } catch {
      cosmetics = DEFAULT_COSMETICS
    }
  }
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
    coins: row.coins ?? 0,
    cosmetics,
    createdAt: row.created_at,
  }
}

export interface QuizDTO {
  id: string
  title: string
  description: string
  subject: string
  difficulty: Difficulty
  kind: QuizKind
  timeLimitSec: number | null
  published: boolean
  questionCount: number
  teacherName: string
  classroomName: string | null
  packId?: string | null
  modelId?: string | null
  standards?: string | string[]
  lessonId?: string | null
  srsInterleave?: boolean
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
  figure: FigureSpec | null
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
  /** Prepared drawing data for figure questions (asked values become "?"). */
  figure: FigureGeometry | null
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
  /**
   * Drawing data for figure questions, built from the variant the student
   * actually saw (parameterized figures) or the stored spec. null for
   * every other question type.
   */
  figure: FigureGeometry | null
  /**
   * The student's confidence self-rating for this answer, when they
   * tagged one. Drives the "knew it vs. guessed it" calibration view.
   */
  confidence: Confidence | null
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

export interface AttemptReviewQuestionDTO {
  id: string
  type: QuestionType
  prompt: string
  options: string[] | null
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
  coinsEarned: { amount: number; currencyName: string; currencyIcon: string } | null
  levelRewards: {
    level: number
    rewardType: 'coins' | 'item'
    coins: number
    itemName: string | null
    currencyName: string
    currencyIcon: string
  }[]
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
  cosmetics: Cosmetics
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
  assignments: AssignmentDueDTO[]
  lessonsSummary?: {
    tracksStarted: number
    lessonsCompleted: number
    totalLessons: number
    nextLessonId?: string
    nextLessonTitle?: string
    masteredSkills: number
  }
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
  /** "Knew it vs. guessed it" calibration over this quiz's tagged answers. */
  confidence: ConfidenceSummary
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
  /** Master kill switch — one click in Settings turns every AI surface off. */
  enabled: boolean
}

export interface NotificationDTO {
  id: string
  type: string
  title: string
  body: string
  data: Record<string, unknown> | null
  read: boolean
  createdAt: string
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

// ── Spaced repetition ─────────────────────────────────────────
export type { ReviewGrade, SrsState } from './srs'

export interface SrsCardDTO {
  questionId: string
  quizId: string
  quizTitle: string
  subject?: string
  prompt: string
  type: QuestionType
  isNew: boolean
  /** Practice-only: arrives with the queue; reveal on tap. */
  answer: string
  explanation: string
  /** Deck grouping key used by the interleaver (the quiz id). */
  category: string
  state: SrsState | null
  /**
   * MCQ answer options (null for every other type). Additive: older
   * clients ignore it; the arcade uses it to build tap-to-answer rounds.
   */
  options?: string[] | null
  /** Drawable SVG figure payload for figure-type SRS cards. */
  figure?: FigureGeometry | null
  /** False for language/vocab decks that should stay blocked by category rather than interleaved. */
  interleave?: boolean
  /** Linked content pack id when installed/seeded from a pack. */
  packId?: string | null
  /** Distinguishes quiz-backed cards from standalone lesson flashcard seeds. */
  sourceType?: 'question' | 'lesson-flashcard'
}

/** Which queue a Streak Siege card was drawn from. */
export type SiegePool = 'due' | 'weak' | 'new'

export interface SiegeCardDTO extends SrsCardDTO {
  pool: SiegePool
}

// ── Arcade ──
export interface ArcadeSummaryDTO {
  coins: number
  earnedToday: number
  dailyCap: number
  currencyName: string
  currencyIcon: string
}

export interface ArcadeRunResultDTO {
  /** Coins actually credited (after the daily cap). */
  coinsEarned: number
  /** What the run was worth before the cap. */
  coinsWorth: number
  balance: number
  earnedToday: number
  dailyCap: number
  capped: boolean
  currencyName: string
  currencyIcon: string
}

export interface SrsStatsDTO {
  dueCount: number
  scheduledCount: number
  newCount: number
  totalCards: number
  reviewedToday: number
}

// ── Assignments ───────────────────────────────────────────────
export interface AssignmentRow {
  id: string
  quiz_id: string
  classroom_id: string | null
  student_id: string | null
  title: string
  due_date: string | null
  available_from: string | null
  max_attempts: number
  required_lesson_id?: string | null
  created_by: string
  created_at: string
}

export interface AssignmentDTO {
  id: string
  quizId: string
  quizTitle: string
  classroomId: string | null
  classroomName: string | null
  studentId: string | null
  studentName: string | null
  title: string
  dueDate: string | null
  availableFrom: string | null
  maxAttempts: number
  requiredLessonId?: string | null
  requiredLessonTitle?: string | null
  createdAt: string
  /** How many students the assignment reaches. */
  assignedCount: number
  /** How many of them have finished at least one attempt. */
  completedCount: number
}

export interface AssignmentRosterDTO {
  studentId: string
  studentName: string
  attemptsUsed: number
  completed: boolean
  bestScore: number | null
  bestMaxScore: number | null
  completedAt: string | null
}

export interface AssignmentDueDTO {
  id: string
  title: string
  quizId: string
  quizTitle: string
  subject: string
  dueDate: string | null
  /** Days until due (negative = overdue), null when there is no due date. */
  daysLeft: number | null
  availableFrom: string | null
  locked: boolean
  attemptsUsed: number
  maxAttempts: number
  completed: boolean
  bestScore: number | null
  requiredLessonId?: string | null
  requiredLessonTitle?: string | null
  lessonCompleted?: boolean
}

// ── Live race mode ─────────────────────────────────────────────
// Races are ephemeral, in-memory, LAN-first room events: no coins,
// no XP, no persisted attempts — a motivation top-up (per the
// roadmap's honest framing of Kahoot-style play). Everything the
// client needs travels over one WebSocket as JSON frames; REST
// endpoints only create rooms and drive the host's controls.

export type RacePhase = 'lobby' | 'question' | 'reveal' | 'over'

export type RacePingTag = 'hold' | 'think-mine' | 'check-units' | 'ready'

export interface RaceSquadDTO {
  id: string
  name: string
  color: string
  progress: number
  score: number
  memberIds: string[]
}

export interface RaceHandOptionDTO {
  idx: number
  text: string
}

export interface ClassroomSiegeStateDTO {
  bossHp: number
  maxHp: number
  aegisShield: number
  wave: number
  sealsBroken: number
  topMissedQuestionIds: string[]
  recalibrateCooldownSec?: number
}

export interface RacePlayerDTO {
  userId: string
  name: string
  avatarColor: string
  score: number
  correctCount: number
  streak: number
  /** Has this player locked in an answer for the current question? */
  answered: boolean
  /** How the current question went (null until it is revealed). */
  lastCorrect: boolean | null
  /** Points won on the most recent reveal (0 when the answer missed). */
  lastPoints: number
  /** Assigned squad ID in squad-sync mode. */
  squadId?: string
  /** Assigned squad display name in squad-sync mode. */
  squadName?: string
  /** Most recent non-verbal quick ping in squad-sync mode. */
  ping?: RacePingTag | null
}

/** A question as pushed mid-race — student-safe: no correct answer. */
export interface RaceQuestionDTO {
  id: string
  type: QuestionType
  prompt: string
  options: string[] | null
  figure: FigureGeometry | null
  points: number
  index: number
  total: number
  /** Epoch ms the question opened; clients render their own timer. */
  openedAt: number
}

export interface RaceRoomDTO {
  code: string
  quizId: string
  quizTitle: string
  subject: string
  phase: RacePhase
  questionIndex: number
  totalQuestions: number
  players: RacePlayerDTO[]
  mode?: RaceMode
  squadSize?: number
  squads?: RaceSquadDTO[]
  siege?: ClassroomSiegeStateDTO
}

export interface RaceRevealDTO {
  questionId: string
  correctAnswer: unknown
  figure: FigureGeometry | null
  explanation: string
  correctCount: number
  answeredCount: number
}

// ── Race wire protocol (JSON frames over /api/race/:code) ──────
export type RaceClientFrame =
  | { t: 'answer'; response: number | boolean | string | number[]; msTaken: number }
  | { t: 'ping'; tag: RacePingTag }
  | { t: 'squad_submit'; optionIdx: number; msTaken: number }

export type RaceServerFrame =
  | {
      t: 'joined'
      room: RaceRoomDTO
      /** The current question, when the race is already running. */
      question: RaceQuestionDTO | null
      /** Cached reveal while the reveal phase is on screen. */
      reveal: RaceRevealDTO | null
      /** Cached standings once the race is over. */
      standings: RacePlayerDTO[] | null
      /** The connecting user's own row (host gets their pseudo-row). */
      you: RacePlayerDTO
      role: 'host' | 'player'
    }
  | { t: 'player_joined'; player: RacePlayerDTO }
  | { t: 'player_left'; userId: string }
  | { t: 'question'; question: RaceQuestionDTO }
  | { t: 'answered'; userId: string; answeredCount: number }
  | {
      t: 'squad_question'
      round: number
      stem: string
      figure?: FigureGeometry | null
      handOptions: RaceHandOptionDTO[]
      squads: RaceSquadDTO[]
      squadProgress: Record<string, number>
    }
  | { t: 'squad_ping'; userId: string; squadId: string; tag: RacePingTag }
  | {
      t: 'siege_state'
      siege: ClassroomSiegeStateDTO
      cooldownUntilMs?: number
      recalibrateHint?: string
    }
  | {
      t: 'reveal'
      reveal: RaceRevealDTO
      players: RacePlayerDTO[]
      you: RacePlayerDTO
    }
  | { t: 'over'; standings: RacePlayerDTO[]; you: RacePlayerDTO }
  | { t: 'error'; message: string }

// ── Classroom economy ──────────────────────────────────────────
export interface EconomyDTO {
  currencyName: string
  currencyIcon: string
  pointsPerCoin: number
}

export interface LevelRewardDTO {
  id: string
  level: number
  rewardType: 'coins' | 'item'
  coins: number
  itemId: string | null
  itemName: string | null
}

export interface ShopItemDTO {
  id: string
  teacherId: string
  teacherName: string
  name: string
  description: string
  category: 'background' | 'nameplate' | 'name-style' | 'font'
  price: number
  itemData: Paint | Nameplate | { font: string }
  active: boolean
  owned: boolean
  purchaseCount: number
  createdAt: string
}

export interface CoinTxDTO {
  id: string
  delta: number
  balanceAfter: number
  reason: string
  currencyName: string
  createdAt: string
}

// ── Lessons & Curriculum Tracks ────────────────────────────────
export interface SkillMasteryDTO {
  skillId: string
  level: MasteryLevel
  scorePct: number
  updatedAt: string
}

export interface LessonProgressDTO {
  lessonId: string
  trackId: string
  packId: string
  completed: boolean
  completedSteps: string[]
  highestStepIndex: number
  checkpointCorrectCount: number
  checkpointTotalCount: number
  challengeCompleted: boolean
  masteryLevel: MasteryLevel
  scorePct: number
  timeSpentSec: number
  completedAt: string | null
  updatedAt: string
}

export interface LessonSummaryDTO {
  id: string
  unitId: string
  trackId: string
  packId: string
  title: string
  summary: string
  estimatedMinutes: number
  standards: string[]
  prerequisiteLessonIds: string[]
  hasVisual: boolean
  visualKind: 'model-3d' | 'model-2d' | 'figure-2d' | 'none'
  unlocked: boolean
  completed: boolean
  masteryLevel: MasteryLevel
  stepCount: number
}

export interface TrackUnitDTO {
  id: string
  title: string
  anchoringPhenomenon: string
  capstoneQuizIndex?: number
  masteryGate?: MasteryGate
  lessons: LessonSummaryDTO[]
}

export interface CurriculumTrackDTO {
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
  totalLessons: number
  completedLessons: number
  masteryLevel: MasteryLevel
  units: TrackUnitDTO[]
}

export interface TrackDetailDTO {
  track: CurriculumTrackDTO
  relatedQuizzes: {
    id: string
    title: string
    difficulty: Difficulty
    questionCount: number
  }[]
}

export interface LessonDetailDTO {
  lesson: PackLesson
  track: Omit<CurriculumTrackDTO, 'units'>
  unit: Omit<TrackUnitDTO, 'lessons'>
  progress: LessonProgressDTO
  prerequisitesMet: boolean
  prerequisiteLessons: { id: string; title: string; completed: boolean }[]
  nextLessonId: string | null
  prevLessonId: string | null
  linkedQuizId: string | null
  enrolledFlashcardCount: number
}
