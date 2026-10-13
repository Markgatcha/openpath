import { buildFigureGeometry } from '../../shared/figure'
import type { FigureSpec } from '../../shared/schemas'
import type {
  AttemptRow,
  AttemptSummaryDTO,
  BadgeDTO,
  BadgeRow,
  QuestionRow,
  QuizDTO,
  QuizRow,
  StudentQuestionDTO,
  TeacherQuestionDTO,
} from '../../shared/types'

export function toQuestionTeacherDTO(row: QuestionRow): TeacherQuestionDTO {
  const figure =
    row.type === 'figure' && row.options_json
      ? (JSON.parse(row.options_json) as FigureSpec)
      : null
  return {
    id: row.id,
    type: row.type,
    prompt: row.prompt,
    options: figure ? null : row.options_json ? JSON.parse(row.options_json) : null,
    figure,
    correct: JSON.parse(row.correct_json),
    alternatives: row.alternatives_json
      ? JSON.parse(row.alternatives_json)
      : [],
    points: row.points,
    position: row.position,
    explanation: row.explanation,
  }
}

export function toStudentQuestionDTO(row: QuestionRow): StudentQuestionDTO {
  if (row.type === 'figure' && row.options_json) {
    const spec = JSON.parse(row.options_json) as FigureSpec
    return {
      id: row.id,
      type: row.type,
      prompt: row.prompt,
      options: null,
      figure: buildFigureGeometry(spec),
      points: row.points,
      position: row.position,
    }
  }
  return {
    id: row.id,
    type: row.type,
    prompt: row.prompt,
    options: row.options_json ? JSON.parse(row.options_json) : null,
    figure: null,
    points: row.points,
    position: row.position,
  }
}

export interface QuizDTOExtras {
  questionCount: number
  teacherName: string
  classroomName: string | null
  attemptCount: number
  myBestScore: number | null
}

export function toQuizDTO(row: QuizRow, extras: QuizDTOExtras): QuizDTO {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    subject: row.subject,
    difficulty: row.difficulty,
    kind: row.kind ?? 'quiz',
    timeLimitSec: row.time_limit_sec,
    published: row.published === 1,
    questionCount: extras.questionCount,
    teacherName: extras.teacherName,
    classroomName: extras.classroomName,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    attemptCount: extras.attemptCount,
    myBestScore: extras.myBestScore,
  }
}

export function toAttemptSummaryDTO(
  row: AttemptRow,
  quizTitle: string,
  subject: string,
): AttemptSummaryDTO {
  return {
    id: row.id,
    quizId: row.quiz_id,
    quizTitle,
    subject,
    score: row.score,
    maxScore: row.max_score,
    accuracy: row.max_score > 0 ? row.score / row.max_score : 0,
    xpEarned: row.xp_earned,
    correctCount: row.correct_count,
    totalQuestions: row.total_questions,
    comboBest: row.combo_best,
    durationSec: row.duration_sec,
    finishedAt: row.finished_at,
    createdAt: row.created_at,
  }
}

export function toBadgeDTO(
  row: BadgeRow,
  earned: boolean,
  earnedAt: string | null,
): BadgeDTO {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    earned,
    earnedAt,
  }
}
