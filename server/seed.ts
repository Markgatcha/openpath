import { randomUUID } from 'node:crypto'
import { db } from './db'
import { hashPassword } from './lib/auth'
import { computeXp } from '../shared/game'
import type { QuestionRow, QuizRow } from '../shared/types'

interface SeedQuestion {
  type: QuestionRow['type']
  prompt: string
  options?: string[]
  correct: number | boolean | string | number[]
  alternatives?: string[]
  points?: number
  explanation?: string
}

interface SeedQuiz {
  title: string
  description: string
  subject: string
  difficulty: QuizRow['difficulty']
  timeLimitSec: number | null
  classroomId?: string
  questions: SeedQuestion[]
}

function addUser(
  id: string,
  email: string,
  name: string,
  role: 'student' | 'teacher' | 'parent',
  password: string,
  avatarColor: string,
  options: { linkCode?: string; dailyGoalMinutes?: number } = {},
): void {
  db.prepare(
    `INSERT INTO users (id, email, name, role, password_hash, avatar_color, link_code, daily_goal_minutes, minutes_today_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, date('now'))`,
  ).run(
    id,
    email,
    name,
    role,
    hashPassword(password),
    avatarColor,
    options.linkCode ?? null,
    options.dailyGoalMinutes ?? 20,
  )
}

function addQuiz(teacherId: string, quiz: SeedQuiz): string {
  const id = randomUUID()
  db.prepare(
    `INSERT INTO quizzes (id, title, description, subject, difficulty, teacher_id, classroom_id, time_limit_sec, published)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
  ).run(
    id,
    quiz.title,
    quiz.description,
    quiz.subject,
    quiz.difficulty,
    teacherId,
    quiz.classroomId ?? null,
    quiz.timeLimitSec,
  )

  quiz.questions.forEach((question, index) => {
    db.prepare(
      `INSERT INTO questions (id, quiz_id, type, prompt, options_json, correct_json, alternatives_json, points, position, explanation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      randomUUID(),
      id,
      question.type,
      question.prompt,
      question.options ? JSON.stringify(question.options) : null,
      JSON.stringify(question.correct),
      question.alternatives ? JSON.stringify(question.alternatives) : null,
      question.points ?? 10,
      index,
      question.explanation ?? '',
    )
  })

  return id
}

function wrongResponseFor(question: QuestionRow): string {
  switch (question.type) {
    case 'mcq': {
      const correct = JSON.parse(question.correct_json) as number
      const options = question.options_json
        ? (JSON.parse(question.options_json) as string[])
        : []
      return JSON.stringify((correct + 1) % Math.max(options.length, 2))
    }
    case 'truefalse':
      return JSON.stringify(!(JSON.parse(question.correct_json) as boolean))
    case 'order': {
      const correct = JSON.parse(question.correct_json) as number[]
      return JSON.stringify([...correct].reverse())
    }
    default:
      return JSON.stringify('not sure')
  }
}

function addAttempt(
  studentId: string,
  quizId: string,
  wrongPositions: number[],
  daysAgo: number,
): number {
  const quiz = db
    .prepare('SELECT * FROM quizzes WHERE id = ?')
    .get(quizId) as QuizRow
  const questions = db
    .prepare('SELECT * FROM questions WHERE quiz_id = ? ORDER BY position')
    .all(quizId) as QuestionRow[]

  const attemptId = randomUUID()
  const maxScore = questions.reduce((sum, q) => sum + q.points, 0)
  const durationSec = 180 + questions.length * 35

  // The parent attempts row must exist before its answers (FK).
  db.prepare(
    'INSERT INTO attempts (id, quiz_id, student_id) VALUES (?, ?, ?)',
  ).run(attemptId, quizId, studentId)

  let score = 0
  let correctCount = 0

  questions.forEach((question, index) => {
    const isCorrect = !wrongPositions.includes(index)
    if (isCorrect) {
      score += question.points
      correctCount += 1
    }
    db.prepare(
      `INSERT INTO attempt_answers (id, attempt_id, question_id, response_json, correct, ms_taken)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      randomUUID(),
      attemptId,
      question.id,
      isCorrect ? question.correct_json : wrongResponseFor(question),
      isCorrect ? 1 : 0,
      3200 + index * 850,
    )
  })

  const xp = computeXp({
    correct: correctCount,
    total: questions.length,
    comboBest: correctCount,
    avgMs: 6800,
    difficulty: quiz.difficulty,
    timeUsedSec: durationSec,
    timeLimitSec: quiz.time_limit_sec,
  })

  db.prepare(
    `UPDATE attempts
     SET score = ?, max_score = ?, xp_earned = ?, correct_count = ?, total_questions = ?,
         combo_best = ?, duration_sec = ?, finished_at = datetime('now', ?)
     WHERE id = ?`,
  ).run(
    score,
    maxScore,
    xp,
    correctCount,
    questions.length,
    correctCount,
    durationSec,
    `-${daysAgo} days`,
    attemptId,
  )

  return xp
}

export function seedIfEmpty(): void {
  const userCount = (
    db.prepare('SELECT COUNT(*) as n FROM users').get() as { n: number }
  ).n
  if (userCount > 0) return

  const teacherId = 'demo-teacher'
  const graceId = 'demo-grace'
  const linusId = 'demo-linus'
  const maryId = 'demo-mary'

  addUser(teacherId, 'ada.lovelace@openpath.dev', 'Ada Lovelace', 'teacher', 'teach1234', '#8b5cf6')
  addUser(graceId, 'grace.hopper@openpath.dev', 'Grace Hopper', 'student', 'learn1234', '#06b6d4', {
    linkCode: 'OL-GRC01',
    dailyGoalMinutes: 25,
  })
  addUser(linusId, 'linus.torvalds@openpath.dev', 'Linus Torvalds', 'student', 'learn1234', '#f59e0b', {
    linkCode: 'OL-LNX02',
    dailyGoalMinutes: 20,
  })
  addUser(maryId, 'mary.jackson@openpath.dev', 'Mary Jackson', 'parent', 'parent1234', '#ec4899')

  db.prepare(
    `INSERT INTO classrooms (id, name, subject, teacher_id, join_code)
     VALUES ('demo-room42', 'Room 42', 'Science', ?, 'ROOM42')`,
  ).run(teacherId)
  db.prepare(
    'INSERT INTO classroom_members (classroom_id, student_id) VALUES (?, ?)',
  ).run('demo-room42', graceId)
  db.prepare(
    'INSERT INTO classroom_members (classroom_id, student_id) VALUES (?, ?)',
  ).run('demo-room42', linusId)

  db.prepare(
    'INSERT INTO parent_links (parent_id, student_id) VALUES (?, ?)',
  ).run(maryId, graceId)
  db.prepare(
    'INSERT INTO parent_links (parent_id, student_id) VALUES (?, ?)',
  ).run(maryId, linusId)

  const solarQuiz = addQuiz(teacherId, {
    title: 'Solar System Safari',
    description: 'A guided tour of our cosmic neighbourhood — planets, moons, and one very shiny star.',
    subject: 'Science',
    difficulty: 'medium',
    timeLimitSec: 600,
    classroomId: 'demo-room42',
    questions: [
      {
        type: 'mcq',
        prompt: 'Which planet is known as the Red Planet?',
        options: ['Mars', 'Venus', 'Jupiter', 'Mercury'],
        correct: 0,
        explanation: 'Iron oxide (rust) in the soil gives Mars its reddish colour.',
        points: 10,
      },
      {
        type: 'mcq',
        prompt: 'Which planet has the most prominent ring system?',
        options: ['Saturn', 'Neptune', 'Earth', 'Uranus'],
        correct: 0,
        explanation: 'Saturn’s rings are the most visible, made of ice and rock.',
        points: 10,
      },
      {
        type: 'truefalse',
        prompt: 'The Sun is a planet.',
        correct: false,
        explanation: 'The Sun is a star — a ball of plasma powered by nuclear fusion.',
        points: 10,
      },
      {
        type: 'fill',
        prompt: 'What is the name of the galaxy that contains our Solar System?',
        correct: 'Milky Way',
        alternatives: ['the milky way', 'milky way galaxy'],
        explanation: 'We live in the Milky Way, a barred spiral galaxy.',
        points: 10,
      },
      {
        type: 'order',
        prompt: 'Order these planets by distance from the Sun (closest first).',
        options: ['Mercury', 'Venus', 'Earth', 'Mars'],
        correct: [0, 1, 2, 3],
        explanation: 'The inner planets in order are Mercury, Venus, Earth, Mars.',
        points: 10,
      },
      {
        type: 'mcq',
        prompt: 'Which is the largest planet in our Solar System?',
        options: ['Jupiter', 'Saturn', 'Neptune', 'Earth'],
        correct: 0,
        explanation: 'Jupiter is a gas giant over 1,300 times Earth’s volume.',
        points: 10,
      },
    ],
  })

  const capitalsQuiz = addQuiz(teacherId, {
    title: 'World Capitals',
    description: 'Do you know where the decisions happen? Test your capital-city knowledge.',
    subject: 'Geography',
    difficulty: 'easy',
    timeLimitSec: null,
    questions: [
      {
        type: 'mcq',
        prompt: 'What is the capital of France?',
        options: ['Paris', 'Lyon', 'Marseille', 'Nice'],
        correct: 0,
        explanation: 'Paris has been the capital of France for centuries.',
        points: 10,
      },
      {
        type: 'mcq',
        prompt: 'What is the capital of Japan?',
        options: ['Tokyo', 'Kyoto', 'Osaka', 'Sapporo'],
        correct: 0,
        explanation: 'Tokyo became the capital in 1868, replacing Kyoto.',
        points: 10,
      },
      {
        type: 'truefalse',
        prompt: 'Canberra is the capital of Australia.',
        correct: true,
        explanation: 'Canberra was purpose-built as the capital; Sydney is bigger but not the capital.',
        points: 10,
      },
      {
        type: 'fill',
        prompt: 'What is the capital of Canada?',
        correct: 'Ottawa',
        alternatives: ['ottawa, ontario'],
        explanation: 'Ottawa was chosen as the capital by Queen Victoria in 1857.',
        points: 10,
      },
      {
        type: 'mcq',
        prompt: 'Which city is the capital of Brazil?',
        options: ['Brasilia', 'Rio de Janeiro', 'Sao Paulo', 'Salvador'],
        correct: 0,
        explanation: 'Brasilia was inaugurated in 1960 as the purpose-built capital.',
        points: 10,
      },
    ],
  })

  const fractionQuiz = addQuiz(teacherId, {
    title: 'Fraction Frenzy',
    description: 'Halves, thirds, quarters — prove your fraction fluency against the clock.',
    subject: 'Math',
    difficulty: 'medium',
    timeLimitSec: 300,
    questions: [
      {
        type: 'mcq',
        prompt: 'What is 1/2 + 1/4?',
        options: ['3/4', '2/6', '1/3', '1/6'],
        correct: 0,
        explanation: '1/2 = 2/4, and 2/4 + 1/4 = 3/4.',
        points: 10,
      },
      {
        type: 'mcq',
        prompt: 'Which fraction is equivalent to 0.75?',
        options: ['3/4', '7/5', '2/3', '1/4'],
        correct: 0,
        explanation: '0.75 = 75/100 = 3/4.',
        points: 10,
      },
      {
        type: 'fill',
        prompt: 'What is 2/3 × 3/4? (answer as a fraction or decimal)',
        correct: '1/2',
        alternatives: ['0.5', 'one half', '6/12'],
        explanation: '2/3 × 3/4 = 6/12 = 1/2.',
        points: 10,
      },
      {
        type: 'order',
        prompt: 'Order these fractions from smallest to largest.',
        options: ['1/2', '1/3', '1/4', '1/5'],
        correct: [3, 2, 1, 0],
        explanation: 'With the same numerator, the bigger denominator means the smaller fraction.',
        points: 10,
      },
    ],
  })

  // Grace: strong student with history across all three subjects.
  const graceXp =
    addAttempt(graceId, solarQuiz, [2], 2) +
    addAttempt(graceId, capitalsQuiz, [4], 5) +
    addAttempt(graceId, fractionQuiz, [], 1)

  // Linus: newer to the journey.
  const linusXp = addAttempt(linusId, solarQuiz, [1, 4], 3)

  db.prepare(
    `UPDATE users SET xp = ?, streak_days = 4, streak_last_active = date('now'), minutes_today = 18, minutes_today_date = date('now')
     WHERE id = ?`,
  ).run(graceXp, graceId)
  db.prepare(
    `UPDATE users SET xp = ?, streak_days = 2, streak_last_active = date('now'), minutes_today = 8, minutes_today_date = date('now')
     WHERE id = ?`,
  ).run(linusXp, linusId)

  // Grace earned her badges honestly.
  db.prepare(
    'INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)',
  ).run(graceId, 'first_quiz')
  db.prepare(
    'INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)',
  ).run(graceId, 'perfect')
  db.prepare(
    'INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)',
  ).run(graceId, 'explorer')
  db.prepare(
    'INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)',
  ).run(linusId, 'first_quiz')

  console.log(`
  🌱 Seeded demo data:
     Teacher → ada.lovelace@openpath.dev / teach1234
     Student → grace.hopper@openpath.dev / learn1234   (link code OL-GRC01)
     Student → linus.torvalds@openpath.dev / learn1234 (link code OL-LNX02)
     Parent  → mary.jackson@openpath.dev / parent1234
`)
}
