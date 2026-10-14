import { randomUUID } from 'node:crypto'
import { db } from '../db'

// ---------------------------------------------------------------------------
// In-app notifications. Local-first by design: everything lives in SQLite,
// the bell/feed works offline, and nothing ever leaves the machine.
// (Push/email would need a server or an SMTP account — deliberately v2.)
// ---------------------------------------------------------------------------

export type NotificationType = 'work_completed'

export interface NotificationInput {
  type: NotificationType
  title: string
  body?: string
  data?: Record<string, unknown>
}

/** Insert a notification for one user. Never throws — notifications are
 *  courtesy, not correctness: a failure here must not fail the attempt. */
export function createNotification(
  userId: string,
  input: NotificationInput,
): void {
  try {
    db.prepare(
      `INSERT INTO notifications (id, user_id, type, title, body, data_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      randomUUID(),
      userId,
      input.type,
      input.title,
      input.body ?? '',
      input.data ? JSON.stringify(input.data) : null,
    )
  } catch (err) {
    console.error('[notifications] insert failed:', err)
  }
}

/** Fan a notification out to every parent linked to this student. */
export function notifyParents(
  studentId: string,
  input: NotificationInput,
): void {
  const parents = db
    .prepare('SELECT parent_id FROM parent_links WHERE student_id = ?')
    .all(studentId) as { parent_id: string }[]
  for (const parent of parents) {
    createNotification(parent.parent_id, input)
  }
}

export interface WorkCompletedInput {
  studentId: string
  studentName: string
  quizTitle: string
  kind: string
  accuracy: number
  attemptId: string
  quizId: string
}

/**
 * "Ada finished their homework" — the event parents and teachers asked for.
 * Recipients: the teacher who owns the quiz, plus every linked parent.
 * Fires for homework and classwork quizzes (the graded, out-of-class work);
 * live quizzes/tests are supervised and don't need a hallway announcement.
 */
export function notifyWorkCompleted(input: WorkCompletedInput): void {
  const pct = Math.round(input.accuracy * 100)
  const label = input.kind === 'classwork' ? 'classwork' : 'homework'
  const payload: NotificationInput = {
    type: 'work_completed',
    title: `${input.studentName} finished their ${label}`,
    body: `“${input.quizTitle}” — ${pct}% correct.`,
    data: {
      studentId: input.studentId,
      attemptId: input.attemptId,
      quizId: input.quizId,
      kind: input.kind,
      accuracy: input.accuracy,
    },
  }

  const quizTeacher = db
    .prepare('SELECT teacher_id FROM quizzes WHERE id = ?')
    .get(input.quizId) as { teacher_id: string } | undefined
  if (quizTeacher) {
    createNotification(quizTeacher.teacher_id, payload)
  }
  notifyParents(input.studentId, payload)
}
