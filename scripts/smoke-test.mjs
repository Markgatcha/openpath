/**
 * OpenPath end-to-end smoke test.
 * Boots against a running server (pnpm dev or pnpm start) and exercises
 * the full loop: teacher forges a quiz (incl. a computed figure question)
 * → student plays it → XP is awarded → parent sees progress → spaced
 * repetition schedules the flashcards.
 *
 *   node scripts/smoke-test.mjs [baseUrl]
 */
const BASE = process.argv[2] ?? 'http://localhost:8787'

let passed = 0
let failed = 0

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1
    console.log(`  ✓ ${name}`)
  } else {
    failed += 1
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

async function api(path, { method = 'GET', body, token } = {}) {
  const headers = {
    // Fastify rejects a json content-type with an empty body, so only
    // send the header when we actually have a payload.
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  const options = { method, headers }
  // Only attach the body key when there is one (GET + body is invalid).
  if (body) options.body = JSON.stringify(body)
  const response = await fetch(`${BASE}/api${path}`, options)
  const data = await response.json().catch(() => ({}))
  return { status: response.status, data }
}

async function login(email, password) {
  const result = await api('/auth/login', {
    method: 'POST',
    body: { email, password },
  })
  if (!result.data.token) throw new Error(`login failed for ${email}: ${JSON.stringify(result.data)}`)
  return result.data.token
}

async function main() {
  console.log(`\n🧪 OpenPath smoke test against ${BASE}\n`)

  // ── Teacher forges a quiz ────────────────────────────────────
  console.log('Teacher flow:')
  const teacherToken = await login('ada.lovelace@openpath.dev', 'teach1234')
  const created = await api('/quizzes', {
    method: 'POST',
    token: teacherToken,
    body: {
      title: 'Smoke Test Sprint',
      subject: 'Science',
      difficulty: 'easy',
      description: 'A quiz born in the fires of CI.',
      timeLimitSec: 300,
    },
  })
  check('teacher creates quiz', created.status === 201 && created.data.quiz?.id)
  const quizId = created.data.quiz.id

  const mcq = await api(`/quizzes/${quizId}/questions`, {
    method: 'POST',
    token: teacherToken,
    body: {
      type: 'mcq',
      prompt: 'What do bees collect?',
      options: ['Nectar', 'Laptops', 'Satellites', 'Socks'],
      correct: 0,
      explanation: 'Bees collect nectar to make honey.',
      points: 10,
    },
  })
  check('adds multiple-choice question', mcq.status === 201)

  const order = await api(`/quizzes/${quizId}/questions`, {
    method: 'POST',
    token: teacherToken,
    body: {
      type: 'order',
      prompt: 'Order the planets from the Sun.',
      options: ['Mercury', 'Venus', 'Earth'],
      correct: [0, 1, 2],
      points: 10,
    },
  })
  check('adds ordering question', order.status === 201)

  const badOrder = await api(`/quizzes/${quizId}/questions`, {
    method: 'POST',
    token: teacherToken,
    body: {
      type: 'order',
      prompt: 'Invalid ranking',
      options: ['A', 'B'],
      correct: [5, 1],
      points: 10,
    },
  })
  check('rejects impossible ranking', badOrder.status === 400)

  // SAS triangle: b=7, c=5, included angle 40° → a ≈ 4.51
  const figure = await api(`/quizzes/${quizId}/questions`, {
    method: 'POST',
    token: teacherToken,
    body: {
      type: 'figure',
      prompt: 'Find the length of side a. Round to the nearest tenth.',
      figure: {
        template: 'triangle-sas',
        givens: { b: 7, c: 5, angleA: 40 },
        ask: 'a',
        rounding: 'tenth',
      },
      explanation: 'Law of cosines: a² = b² + c² − 2bc·cos(A).',
      points: 10,
    },
  })
  check('adds figure question', figure.status === 201)
  check(
    'figure answer key is computed server-side',
    typeof figure.data.question?.correct === 'number' &&
      Math.abs(figure.data.question.correct - 4.514) < 0.01,
    `key=${figure.data.question?.correct}`,
  )
  const figureQuestionId = figure.data.question?.id

  const badFigure = await api(`/quizzes/${quizId}/questions`, {
    method: 'POST',
    token: teacherToken,
    body: {
      type: 'figure',
      prompt: 'Impossible triangle',
      figure: {
        template: 'triangle-sss',
        givens: { a: 1, b: 2, c: 10 },
        ask: 'angleA',
        rounding: 'tenth',
      },
      points: 10,
    },
  })
  check('rejects triangle-inequality violation', badFigure.status === 400)

  const published = await api(`/quizzes/${quizId}/publish`, {
    method: 'POST',
    token: teacherToken,
  })
  check('publishes quiz', published.data.quiz?.published === true)

  // ── Student plays it ────────────────────────────────────────
  console.log('\nStudent flow:')
  const studentToken = await login('grace.hopper@openpath.dev', 'learn1234')
  const visible = await api('/quizzes', { token: studentToken })
  check(
    'published quiz visible to student',
    visible.data.quizzes.some((quiz) => quiz.id === quizId),
  )
  check(
    'answers hidden from student list',
    visible.data.quizzes.every((quiz) => !('correct' in quiz)),
  )

  const started = await api('/attempts', {
    method: 'POST',
    token: studentToken,
    body: { quizId },
  })
  check('starts attempt', started.status === 201 && started.data.attemptId)
  check('student questions carry no answers', started.data.questions.length === 3)

  const figureQuestion = started.data.questions.find((q) => q.id === figureQuestionId)
  check(
    'figure question ships drawable geometry, no answer',
    !!figureQuestion?.figure &&
      figureQuestion.figure.vertices.length === 3 &&
      !('correct' in figureQuestion),
  )

  const attemptId = started.data.attemptId
  const first = await api(`/attempts/${attemptId}/answer`, {
    method: 'POST',
    token: studentToken,
    body: {
      questionId: started.data.questions[0].id,
      response: 0,
      msTaken: 2400,
    },
  })
  check('correct answer graded', first.data.correct === true)

  const second = await api(`/attempts/${attemptId}/answer`, {
    method: 'POST',
    token: studentToken,
    body: {
      questionId: started.data.questions[1].id,
      response: [0, 1, 2],
      msTaken: 3100,
    },
  })
  check('ordering answer graded', second.data.correct === true)

  const wrongFigure = await api(`/attempts/${attemptId}/answer`, {
    method: 'POST',
    token: studentToken,
    body: {
      questionId: figureQuestionId,
      response: 9.9,
      msTaken: 4200,
    },
  })
  check('wrong figure answer rejected by tolerance', wrongFigure.data.correct === false)

  const finished = await api(`/attempts/${attemptId}/finish`, {
    method: 'POST',
    token: studentToken,
  })
  check('partial score awarded', finished.data.attempt?.score === 20)
  check('XP earned', finished.data.xpEarned > 0, `xp=${finished.data.xpEarned}`)
  check('perfect badge check ran', Array.isArray(finished.data.newBadges))

  // Second attempt: the same figure question, answered within tolerance.
  const retry = await api('/attempts', {
    method: 'POST',
    token: studentToken,
    body: { quizId },
  })
  check('starts fresh attempt', retry.status === 201 && retry.data.attemptId)
  const goodFigure = await api(`/attempts/${retry.data.attemptId}/answer`, {
    method: 'POST',
    token: studentToken,
    body: {
      questionId: figureQuestionId,
      response: 4.5,
      msTaken: 3600,
    },
  })
  check(
    'in-tolerance figure answer accepted',
    goodFigure.data.correct === true,
    `correct=${goodFigure.data.correct}`,
  )

  const dash = await api('/stats/student/dashboard', { token: studentToken })
  check('dashboard shows the new run', dash.data.recentAttempts.length > 0)

  // ── Spaced repetition ───────────────────────────────────────
  console.log('\nSpaced repetition flow:')
  const due = await api('/srs/due', { token: studentToken })
  check(
    'due queue includes the figure question',
    due.data.cards.some((card) => card.questionId === figureQuestionId),
  )
  const figureCard = due.data.cards.find((card) => card.questionId === figureQuestionId)
  check('cards carry the answer for post-reveal grading', typeof figureCard?.answer === 'string')

  const good = await api('/srs/review', {
    method: 'POST',
    token: studentToken,
    body: { questionId: figureQuestionId, grade: 'good' },
  })
  check(
    'good grade schedules tomorrow',
    good.status === 201 &&
      good.data.state?.reps === 1 &&
      good.data.state?.dueDate > due.data.today,
    JSON.stringify(good.data.state),
  )

  const again = await api('/srs/review', {
    method: 'POST',
    token: studentToken,
    body: { questionId: figureQuestionId, grade: 'again' },
  })
  check(
    'again grade lapses back to today',
    again.status === 201 &&
      again.data.state?.lapses === 1 &&
      again.data.state?.intervalDays === 0 &&
      again.data.state?.dueDate === due.data.today,
    JSON.stringify(again.data.state),
  )

  const badGrade = await api('/srs/review', {
    method: 'POST',
    token: studentToken,
    body: { questionId: figureQuestionId, grade: 'meh' },
  })
  check('rejects unknown grade', badGrade.status === 400)

  const srsStats = await api('/srs/stats', { token: studentToken })
  check(
    'stats track rotation and reviews',
    srsStats.data.totalCards >= 1 && srsStats.data.reviewedToday >= 1,
    JSON.stringify(srsStats.data),
  )

  // ── Parent oversight ────────────────────────────────────────
  console.log('\nParent flow:')
  const parentToken = await login('mary.jackson@openpath.dev', 'parent1234')
  const children = await api('/community/parent/children', { token: parentToken })
  check(
    'parent sees linked child',
    children.data.children.some((child) => child.name === 'Grace Hopper'),
  )

  // ── Guards ───────────────────────────────────────────────────
  console.log('\nSecurity:')
  const noAuth = await api('/stats/student/dashboard')
  check('dashboard requires auth', noAuth.status === 401)
  const wrongRole = await api('/quizzes', {
    method: 'POST',
    token: studentToken,
    body: { title: 'x', subject: 'y' },
  })
  check('students cannot create quizzes', wrongRole.status === 403)

  console.log(`\n${failed === 0 ? '🎉' : '💥'} ${passed} passed, ${failed} failed\n`)
  process.exit(failed === 0 ? 0 : 1)
}

main().catch((error) => {
  console.error('Smoke test crashed:', error)
  process.exit(1)
})
