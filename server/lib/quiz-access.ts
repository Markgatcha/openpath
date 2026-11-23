import { db } from '../db'
import type { QuizRow } from '../../shared/types'

/**
 * Whether a student may see (and therefore play or race) a quiz.
 * Published quizzes are open to everyone unless they belong to a
 * classroom, in which case the student must be a member.
 */
export function studentCanSeeQuiz(studentId: string, quiz: QuizRow): boolean {
  if (quiz.published !== 1) return false
  if (!quiz.classroom_id) return true
  return !!db
    .prepare(
      'SELECT 1 FROM classroom_members WHERE classroom_id = ? AND student_id = ?',
    )
    .get(quiz.classroom_id, studentId)
}
