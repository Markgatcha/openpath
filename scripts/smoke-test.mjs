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

/**
 * Minimal race-socket client: connects, buffers every frame, and
 * resolves `next(match)` with the next frame that matches (or one
 * already buffered). Browsers can't set WS headers, so the JWT
 * rides the `token` query parameter — exactly like the web client.
 */
function raceSocket(code, token, timeoutMs = 4000) {
  const url = `${BASE.replace(/^http/, 'ws')}/api/races/${code}/live?token=${encodeURIComponent(token)}`
  const socket = new WebSocket(url)
  const frames = []
  const waiters = []
  // Frames below this index were already handed to a `next` call.
  // The cursor (not the call site) defines "already seen", so a
  // frame that lands while an HTTP await is in flight is still
  // matched by the next waiter — but never matched twice.
  let consumed = 0

  socket.addEventListener('message', (event) => {
    const frame = JSON.parse(event.data)
    const index = frames.length
    frames.push(frame)
    for (let i = waiters.length - 1; i >= 0; i -= 1) {
      if (waiters[i].match(frame)) {
        waiters.splice(i, 1)[0].resolve(frame)
        consumed = Math.max(consumed, index + 1)
      }
    }
  })

  const next = (match) =>
    new Promise((resolve, reject) => {
      const index = frames.findIndex((frame, i) => i >= consumed && match(frame))
      if (index >= 0) {
        consumed = index + 1
        resolve(frames[index])
        return
      }
      const waiter = { match, resolve }
      waiters.push(waiter)
      setTimeout(() => {
        const at = waiters.indexOf(waiter)
        if (at >= 0) waiters.splice(at, 1)
        reject(
          new Error(
            `race frame timeout; got ${JSON.stringify(frames.map((frame) => frame.t))}`,
          ),
        )
      }, timeoutMs)
    })

  return {
    frames,
    next,
    send: (frame) => socket.send(JSON.stringify(frame)),
    close: () => socket.close(),
  }
}

/** Connect and wait for the handshake frame (`joined`, or an error). */
async function openRaceSocket(code, token) {
  const client = raceSocket(code, token)
  const joined = await client.next((frame) => frame.t === 'joined' || frame.t === 'error')
  if (joined.t === 'error') {
    client.close()
    throw new Error(`race socket refused: ${joined.message}`)
  }
  return { ...client, joined }
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

  // ── Parameterized figure questions ───────────────────────────
  console.log('\nParameterized figure flow:')
  const labQuiz = await api('/quizzes', {
    method: 'POST',
    token: teacherToken,
    body: { title: 'Variation Lab', subject: 'Math', difficulty: 'medium' },
  })
  const labId = labQuiz.data.quiz.id
  await api(`/quizzes/${labId}/questions`, {
    method: 'POST',
    token: teacherToken,
    body: {
      type: 'mcq',
      prompt: 'Which law relates three sides and one included angle?',
      options: ['Law of sines', 'Law of cosines', 'Pythagorean theorem', 'Tangent ratio'],
      correct: 1,
      points: 10,
    },
  })
  const varied = await api(`/quizzes/${labId}/questions`, {
    method: 'POST',
    token: teacherToken,
    body: {
      type: 'figure',
      prompt: 'Find side a. Round to the nearest tenth.',
      figure: {
        template: 'triangle-sas',
        givens: { b: 7, c: 5, angleA: 40 },
        ranges: { b: [5, 12], c: [3, 10] },
        ask: 'a',
        rounding: 'tenth',
      },
      explanation: 'Law of cosines: a² = b² + c² − 2bc·cos(A).',
      points: 10,
    },
  })
  check('accepts parameterized figure', varied.status === 201)
  check(
    'keeps the prototype answer key',
    Math.abs(varied.data.question?.correct - 4.514) < 0.01,
    `key=${varied.data.question?.correct}`,
  )
  const variedQuestionId = varied.data.question?.id

  const invertedRange = await api(`/quizzes/${labId}/questions`, {
    method: 'POST',
    token: teacherToken,
    body: {
      type: 'figure',
      prompt: 'Inverted range',
      figure: {
        template: 'triangle-sas',
        givens: { b: 7, c: 5, angleA: 40 },
        ranges: { b: [12, 5] },
        ask: 'a',
        rounding: 'tenth',
      },
      points: 10,
    },
  })
  check('rejects inverted range', invertedRange.status === 400)

  await api(`/quizzes/${labId}/publish`, { method: 'POST', token: teacherToken })

  /** SAS geometry labels: edge 0 = c, edge 2 = b (edge 1 is the asked "a"). */
  const rangedLabels = (questions) =>
    questions
      .find((question) => question.id === variedQuestionId)
      .figure.edges.map((edge) => edge.label)

  const finishLabRun = async (attemptId, questions) => {
    const mcq = questions.find((question) => question.id !== variedQuestionId)
    await api(`/attempts/${attemptId}/answer`, {
      method: 'POST',
      token: studentToken,
      body: { questionId: mcq.id, response: 1, msTaken: 1200 },
    })
    return api(`/attempts/${attemptId}/finish`, { method: 'POST', token: studentToken })
  }

  // Four separate attempts: numbers should be drawn inside the ranges,
  // and different attempts should not all reuse the same values.
  const labelSets = new Set()
  let valuesInRange = true
  for (let run = 0; run < 4; run += 1) {
    const started = await api('/attempts', {
      method: 'POST',
      token: studentToken,
      body: { quizId: labId },
    })
    const labels = rangedLabels(started.data.questions)
    labelSets.add(labels.join(' '))
    const [cLabel, , bLabel] = labels.map(Number)
    if (bLabel < 5 || bLabel > 12 || cLabel < 3 || cLabel > 10) valuesInRange = false
    const finished = await finishLabRun(started.data.attemptId, started.data.questions)
    check(`variation run ${run + 1} completes`, finished.status === 200)
  }
  check('sampled values honor the teacher ranges', valuesInRange)
  check(
    'retakes draw fresh numbers',
    labelSets.size >= 2,
    `${labelSets.size} distinct value sets`,
  )

  // The revealed answer key must match the numbers on the drawn figure.
  const keyRun = await api('/attempts', {
    method: 'POST',
    token: studentToken,
    body: { quizId: labId },
  })
  const [cKey, , bKey] = rangedLabels(keyRun.data.questions).map(Number)
  const wrongVariant = await api(`/attempts/${keyRun.data.attemptId}/answer`, {
    method: 'POST',
    token: studentToken,
    body: { questionId: variedQuestionId, response: 1, msTaken: 1000 },
  })
  check('wrong variant answer rejected', wrongVariant.data.correct === false)
  const expectedKey = Math.sqrt(
    bKey * bKey + cKey * cKey - 2 * bKey * cKey * Math.cos((40 * Math.PI) / 180),
  )
  check(
    'revealed key matches the drawn figure',
    Math.abs(wrongVariant.data.correctAnswer - expectedKey) <= 0.051,
    `revealed=${wrongVariant.data.correctAnswer} expected≈${expectedKey.toFixed(3)}`,
  )
  await finishLabRun(keyRun.data.attemptId, keyRun.data.questions)

  // In-tolerance answer on the drawn variant is accepted.
  const goodRun = await api('/attempts', {
    method: 'POST',
    token: studentToken,
    body: { quizId: labId },
  })
  const [cGood, , bGood] = rangedLabels(goodRun.data.questions).map(Number)
  const aGood =
    Math.sqrt(
      bGood * bGood + cGood * cGood - 2 * bGood * cGood * Math.cos((40 * Math.PI) / 180),
    )
  const goodVariant = await api(`/attempts/${goodRun.data.attemptId}/answer`, {
    method: 'POST',
    token: studentToken,
    body: {
      questionId: variedQuestionId,
      response: Math.round(aGood * 10) / 10,
      msTaken: 1400,
    },
  })
  check('in-tolerance variant answer accepted', goodVariant.data.correct === true)

  // Resuming an unfinished attempt keeps the numbers it started with.
  const resumeLabels = rangedLabels(goodRun.data.questions).join(' ')
  const resumed = await api('/attempts', {
    method: 'POST',
    token: studentToken,
    body: { quizId: labId },
  })
  check('resume reuses the same attempt', resumed.data.resumed === true)
  check(
    'resumed attempt keeps its variant',
    rangedLabels(resumed.data.questions).join(' ') === resumeLabels,
  )
  await finishLabRun(resumed.data.attemptId, resumed.data.questions)

  // Review mode: the detail endpoint must render the whole run — prompts,
  // stored answers, and the figure exactly as the student saw it.
  const review = await api(`/attempts/${keyRun.data.attemptId}`, { token: studentToken })
  check('attempt detail lists questions for review', review.data.questions.length === 2)
  check('review carries every stored answer', review.data.answers.length === 2)
  const reviewFigure = review.data.breakdown.find((item) => item.figure)
  check(
    'review redraws the drawn variant',
    Boolean(reviewFigure) && reviewFigure.figure.edges[2].label === String(bKey),
    JSON.stringify(reviewFigure?.figure?.edges?.map((edge) => edge.label)),
  )
  check(
    'review prompts carry no answers',
    review.data.questions.every((question) => !('correct' in question)),
  )
  const teacherReview = await api(`/attempts/${keyRun.data.attemptId}`, { token: teacherToken })
  check('teacher can review a student run', teacherReview.status === 200)
  const stranger = await api('/auth/register', {
    method: 'POST',
    body: {
      email: `stranger-${Date.now()}@openpath.dev`,
      name: 'Nosey Neighbor',
      password: 'test1234',
      role: 'student',
    },
  })
  const blockedReview = await api(`/attempts/${keyRun.data.attemptId}`, {
    token: stranger.data.token,
  })
  check('other students cannot review a run', blockedReview.status === 403)

  // ── Confidence + accuracy capture ────────────────────────────
  console.log('\nConfidence capture flow:')
  const confQuiz = await api('/quizzes', {
    method: 'POST',
    token: teacherToken,
    body: { title: 'Confidence Lab', subject: 'Math', difficulty: 'easy' },
  })
  const confQuizId = confQuiz.data.quiz.id
  // Four MCQs: three tagged answers that hit every interesting case
  // (certain+right, certain+wrong, guessed+right) plus one left
  // untagged to prove skipping the prompt stays legal.
  const confPrompts = [
    'What is 2 + 2?',
    'What is 7 × 8?',
    'What is 9 × 9?',
    'Will this one be tagged?',
  ]
  const confQuestionIds = []
  for (const prompt of confPrompts) {
    const created = await api(`/quizzes/${confQuizId}/questions`, {
      method: 'POST',
      token: teacherToken,
      body: {
        type: 'mcq',
        prompt,
        options: ['One', 'Two', 'Three', 'Four'],
        correct: 1,
        points: 10,
      },
    })
    confQuestionIds.push(created.data.question.id)
  }
  await api(`/quizzes/${confQuizId}/publish`, { method: 'POST', token: teacherToken })

  const confStart = await api('/attempts', {
    method: 'POST',
    token: studentToken,
    body: { quizId: confQuizId },
  })
  check('starts the confidence run', confStart.status === 201 && confStart.data.attemptId)
  const confAttemptId = confStart.data.attemptId

  // Right+certain, wrong+certain (overconfident), right+guessed (lucky),
  // and a fourth answer submitted without any confidence field.
  const confPlan = [
    { response: 1, confidence: 'certain' },
    { response: 0, confidence: 'certain' },
    { response: 1, confidence: 'guessed' },
    {},
  ]
  for (const [index, plan] of confPlan.entries()) {
    const answered = await api(`/attempts/${confAttemptId}/answer`, {
      method: 'POST',
      token: studentToken,
      body: {
        questionId: confQuestionIds[index],
        response: plan.response ?? 1,
        msTaken: 1500,
        ...plan,
      },
    })
    check(`answer ${index + 1} accepted`, answered.status === 201, `status=${answered.status} ${JSON.stringify(answered.data)}`)
  }

  const confDetail = await api(`/attempts/${confAttemptId}`, { token: studentToken })
  const confAnswers = confDetail.data.answers
  check(
    'detail echoes per-answer confidence',
    confAnswers[0]?.confidence === 'certain' && confAnswers[2]?.confidence === 'guessed',
    JSON.stringify(confAnswers?.map((a) => a.confidence)),
  )
  check('untagged answer reports null', confAnswers[3]?.confidence === null)
  check(
    'breakdown echoes confidence',
    confDetail.data.breakdown[0]?.confidence === 'certain' &&
      confDetail.data.breakdown[3]?.confidence === null,
  )

  const confFinish = await api(`/attempts/${confAttemptId}/finish`, {
    method: 'POST',
    token: studentToken,
  })
  check('confidence run finishes', confFinish.status === 200)

  // A fresh attempt for the validation probe (already-answered rows
  // short-circuit before the schema check and would mask a failure).
  const confProbe = await api('/attempts', {
    method: 'POST',
    token: studentToken,
    body: { quizId: confQuizId },
  })
  const badConfidence = await api(`/attempts/${confProbe.data.attemptId}/answer`, {
    method: 'POST',
    token: studentToken,
    body: {
      questionId: confQuestionIds[0],
      response: 1,
      msTaken: 100,
      confidence: 'vibes',
    },
  })
  check('rejects unknown confidence level', badConfidence.status === 400, `status=${badConfidence.status}`)

  const confAnalytics = await api(`/quizzes/${confQuizId}/analytics`, { token: teacherToken })
  const summary = confAnalytics.data.confidence
  check(
    'analytics counts only tagged answers',
    summary?.tagged === 3,
    JSON.stringify(summary),
  )
  check(
    'knew-it bucket splits by correctness',
    summary?.knewIt?.seen === 2 && summary?.knewIt?.correct === 1,
    `knewIt=${JSON.stringify(summary?.knewIt)}`,
  )
  check(
    'guessed bucket splits by correctness',
    summary?.guessed?.seen === 1 && summary?.guessed?.correct === 1,
    `guessed=${JSON.stringify(summary?.guessed)}`,
  )
  check('flags the lucky guess', summary?.lucky === 1, `lucky=${summary?.lucky}`)
  check(
    'flags the overconfident miss',
    summary?.overconfident === 1,
    `overconfident=${summary?.overconfident}`,
  )
  check(
    'buckets cover all four levels',
    Array.isArray(summary?.buckets) &&
      summary.buckets.length === 4 &&
      summary.buckets.find((bucket) => bucket.level === 'certain')?.seen === 2,
    JSON.stringify(summary?.buckets),
  )

  // ── Live race mode ───────────────────────────────────────────
  console.log('\nLive race flow:')
  // Reuse the published 3-question quiz (mcq + order + figure):
  // races are ephemeral, so nothing graded is touched.
  const raceCreated = await api('/races', {
    method: 'POST',
    token: teacherToken,
    body: { quizId },
  })
  check('teacher creates a race room', raceCreated.status === 201, `status=${raceCreated.status}`)
  const raceCode = raceCreated.data.code
  check(
    'code is 6 unambiguous characters',
    /^[A-HJ-NP-Z2-9]{6}$/.test(raceCode ?? ''),
    `code=${raceCode}`,
  )

  const studentCreatesRace = await api('/races', {
    method: 'POST',
    token: studentToken,
    body: { quizId },
  })
  check('students cannot create races', studentCreatesRace.status === 403, `status=${studentCreatesRace.status}`)

  const unknownRace = await api('/races/WRONG1', { token: teacherToken })
  check('unknown race code 404s', unknownRace.status === 404, `status=${unknownRace.status}`)

  const lobby = await api(`/races/${raceCode}`, { token: studentToken })
  check(
    'student sees the lobby with no question yet',
    lobby.status === 200 &&
      lobby.data.room.phase === 'lobby' &&
      lobby.data.isHost === false &&
      lobby.data.question === null,
    `status=${lobby.status}`,
  )

  const host = await openRaceSocket(raceCode, teacherToken)
  check('host handshake confirms host role', host.joined.role === 'host')

  const startedRace = await api(`/races/${raceCode}/start`, {
    method: 'POST',
    token: teacherToken,
  })
  check('host starts the race', startedRace.status === 200)
  const hostQuestion = await host.next((frame) => frame.t === 'question')
  check(
    'question frame carries no answers',
    hostQuestion.question?.prompt === 'What do bees collect?' &&
      !('correct' in hostQuestion.question) &&
      hostQuestion.question?.options?.length === 4,
    JSON.stringify(hostQuestion.question),
  )
  check(
    'host cannot start twice',
    (await api(`/races/${raceCode}/start`, { method: 'POST', token: teacherToken })).status === 400,
  )

  // A student who joins mid-question is dropped straight into it.
  const student = await openRaceSocket(raceCode, studentToken)
  check(
    'late joiner lands on the live question',
    student.joined.role === 'player' &&
      student.joined.question?.id === hostQuestion.question.id,
  )
  const joinBroadcast = await host.next((frame) => frame.t === 'player_joined')
  check('roster broadcast names the joiner', joinBroadcast.player.name === 'Grace Hopper')

  // Correct answer in 4.2s: base 10 + speed + first-streak bonuses.
  student.send({ t: 'answer', response: 0, msTaken: 4200 })
  const answered = await host.next((frame) => frame.t === 'answered')
  check('answered tally broadcasts to the room', answered.answeredCount === 1)

  const hostReveal = await host.next((frame) => frame.t === 'reveal')
  check(
    'auto-reveal fires once everyone has answered',
    hostReveal.reveal.correctAnswer === 0 &&
      hostReveal.reveal.correctCount === 1 &&
      hostReveal.reveal.answeredCount === 1,
    JSON.stringify(hostReveal.reveal),
  )
  check(
    'speed and streak bonuses push past base points',
    hostReveal.players[0].score >= 11 && hostReveal.players[0].lastCorrect === true,
    `score=${hostReveal.players[0].score}`,
  )
  const studentReveal = await student.next((frame) => frame.t === 'reveal')
  check(
    'student reveal echoes their own row',
    studentReveal.you.score === hostReveal.players[0].score &&
      studentReveal.you.lastCorrect === true,
    JSON.stringify(studentReveal.you),
  )
  check(
    'double reveal refused',
    (await api(`/races/${raceCode}/reveal`, { method: 'POST', token: teacherToken })).status === 400,
  )

  const nextUp = await api(`/races/${raceCode}/next`, {
    method: 'POST',
    token: teacherToken,
  })
  check('host advances to the next question', nextUp.status === 200)
  const secondQuestion = await host.next((frame) => frame.t === 'question')
  check(
    'second question is the ordering task',
    secondQuestion.question.prompt === 'Order the planets from the Sun.',
  )

  // Wrong ordering: zero points, streak reset, room still auto-reveals.
  student.send({ t: 'answer', response: [1, 0, 2], msTaken: 9000 })
  const secondReveal = await host.next((frame) => frame.t === 'reveal')
  check(
    'wrong answer scores zero and breaks the streak',
    secondReveal.players[0].score === hostReveal.players[0].score &&
      secondReveal.players[0].streak === 0 &&
      secondReveal.players[0].lastCorrect === false &&
      secondReveal.reveal.correctCount === 0,
    JSON.stringify(secondReveal.players[0]),
  )

  const ended = await api(`/races/${raceCode}/end`, {
    method: 'POST',
    token: teacherToken,
  })
  check('host ends the race', ended.status === 200)
  const hostOver = await host.next((frame) => frame.t === 'over')
  check(
    'standings carry the final tally',
    hostOver.standings.length === 1 &&
      hostOver.standings[0].score === hostReveal.players[0].score,
    JSON.stringify(hostOver.standings),
  )
  const studentOver = await student.next((frame) => frame.t === 'over')
  check(
    'student sees the same standings',
    studentOver.standings[0].score === hostOver.standings[0].score,
  )
  check(
    'finished race refuses a student state lookup',
    (await api(`/races/${raceCode}`, { token: studentToken })).status === 400,
  )
  host.close()
  student.close()

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
    'good grade schedules at least tomorrow',
    good.status === 201 &&
      good.data.state?.reps === 1 &&
      good.data.state?.dueDate > due.data.today &&
      good.data.state?.stability > 0,
    JSON.stringify(good.data.state),
  )

  const again = await api('/srs/review', {
    method: 'POST',
    token: studentToken,
    body: { questionId: figureQuestionId, grade: 'again' },
  })
  check(
    'again grade lapses and collapses stability',
    again.status === 201 &&
      again.data.state?.lapses === 1 &&
      again.data.state?.stability < good.data.state?.stability,
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

  // ── Assignments ─────────────────────────────────────────────
  console.log('\nAssignments flow:')
  const teacherClassrooms = await api('/classrooms/mine', { token: teacherToken })
  const classroomId = teacherClassrooms.data.classrooms[0]?.id
  check('teacher has a classroom to assign to', Boolean(classroomId))

  // A dedicated quiz so earlier flows' attempts don't skew the counts.
  const homeworkQuiz = await api('/quizzes', {
    method: 'POST',
    token: teacherToken,
    body: { title: 'Homework Target', subject: 'Math', difficulty: 'easy' },
  })
  await api(`/quizzes/${homeworkQuiz.data.quiz.id}/questions`, {
    method: 'POST',
    token: teacherToken,
    body: {
      type: 'mcq',
      prompt: 'What is 6 × 7?',
      options: ['36', '42', '48', '56'],
      correct: 1,
      points: 10,
    },
  })
  await api(`/quizzes/${homeworkQuiz.data.quiz.id}/publish`, {
    method: 'POST',
    token: teacherToken,
  })
  const hwQuizId = homeworkQuiz.data.quiz.id

  const assignment = await api('/assignments', {
    method: 'POST',
    token: teacherToken,
    body: {
      quizId: hwQuizId,
      classroomId,
      title: 'Smoke sprint — due Friday',
      dueDate: '2099-01-08',
      maxAttempts: 1,
    },
  })
  check('teacher creates assignment', assignment.status === 201 && assignment.data.assignment?.id)
  const assignmentId = assignment.data.assignment?.id

  const roster = await api(`/assignments/${assignmentId}/roster`, { token: teacherToken })
  check(
    'roster lists classroom students',
    roster.status === 200 && roster.data.roster.length >= 2,
    `students=${roster.data.roster?.length}`,
  )
  check(
    'nobody has completed yet',
    roster.data.roster.every((row) => !row.completed),
  )

  const dashAssignments = await api('/stats/student/dashboard', { token: studentToken })
  check(
    'student dashboard shows the assignment',
    dashAssignments.data.assignments?.some((item) => item.id === assignmentId),
  )

  // One attempt allowed, then the cap bites.
  const cappedStart = await api('/attempts', {
    method: 'POST',
    token: studentToken,
    body: { quizId: hwQuizId },
  })
  check('student can start the assignment', cappedStart.status === 201)
  await api(`/attempts/${cappedStart.data.attemptId}/answer`, {
    method: 'POST',
    token: studentToken,
    body: {
      questionId: cappedStart.data.questions[0].id,
      response: 1,
      msTaken: 1200,
    },
  })
  await api(`/attempts/${cappedStart.data.attemptId}/finish`, {
    method: 'POST',
    token: studentToken,
  })
  const overCap = await api('/attempts', {
    method: 'POST',
    token: studentToken,
    body: { quizId: hwQuizId },
  })
  check('attempt cap enforced', overCap.status === 403, `status=${overCap.status}`)

  const raiseCap = await api(`/assignments/${assignmentId}`, {
    method: 'PATCH',
    token: teacherToken,
    body: { maxAttempts: 3 },
  })
  check('teacher raises the cap', raiseCap.status === 200 && raiseCap.data.assignment?.maxAttempts === 3)

  const afterRaise = await api('/attempts', {
    method: 'POST',
    token: studentToken,
    body: { quizId: hwQuizId },
  })
  check(
    'raised cap reopens the quiz',
    afterRaise.status === 201 && afterRaise.data.attemptId !== cappedStart.data.attemptId,
    `status=${afterRaise.status}`,
  )

  const future = await api('/assignments', {
    method: 'POST',
    token: teacherToken,
    body: {
      quizId,
      classroomId,
      title: 'Locked until 2099',
      availableFrom: '2099-02-01',
      maxAttempts: 0,
    },
  })
  check('teacher schedules a future assignment', future.status === 201)

  const lockedQuiz = await api('/quizzes', {
    method: 'POST',
    token: teacherToken,
    body: {
      title: 'Locked Check',
      subject: 'Science',
      difficulty: 'easy',
    },
  })
  await api(`/quizzes/${lockedQuiz.data.quiz.id}/questions`, {
    method: 'POST',
    token: teacherToken,
    body: {
      type: 'mcq',
      prompt: 'Is this quiz locked?',
      options: ['Yes', 'No'],
      correct: 0,
      points: 10,
    },
  })
  await api(`/quizzes/${lockedQuiz.data.quiz.id}/publish`, {
    method: 'POST',
    token: teacherToken,
  })
  await api('/assignments', {
    method: 'POST',
    token: teacherToken,
    body: {
      quizId: lockedQuiz.data.quiz.id,
      classroomId,
      availableFrom: '2099-03-01',
    },
  })
  const blocked = await api('/attempts', {
    method: 'POST',
    token: studentToken,
    body: { quizId: lockedQuiz.data.quiz.id },
  })
  check(
    'availability window blocks early starts',
    blocked.status === 403 && /opens on/.test(blocked.data.error ?? ''),
    `${blocked.status} ${blocked.data.error ?? ''}`,
  )

  // ── Content packs ───────────────────────────────────────────
  console.log('\nContent packs flow:')
  const packs = await api('/packs', { token: teacherToken })
  const geometryPack = packs.data.packs?.find((pack) => pack.id === 'geometry-figures')
  check('pack registry serves 32 curriculum packs', packs.data.packs?.length === 32, `got=${packs.data.packs?.length}`)
  check('pack registry includes geometry-figures with 3D model link', Boolean(geometryPack?.modelId))
  check(
    'geometry pack advertises three tiered quizzes',
    geometryPack?.quizzes?.length === 3,
    JSON.stringify(geometryPack?.quizzes?.map((quiz) => quiz.title)),
  )

  // confirmDuplicates keeps this deterministic across repeated runs against
  // the same database; the refusal path is checked right after.
  const installed = await api('/packs/install', {
    method: 'POST',
    token: teacherToken,
    body: { packId: 'geometry-figures', confirmDuplicates: true },
  })
  check(
    'pack installs as drafts with questions',
    installed.status === 201 &&
      installed.data.quizzes?.length === 3 &&
      installed.data.quizzes.every(
        (quiz) => !quiz.published && quiz.questionCount > 0,
      ),
    JSON.stringify(installed.data.quizzes?.map((quiz) => quiz.questionCount)),
  )

  const reinstall = await api('/packs/install', {
    method: 'POST',
    token: teacherToken,
    body: { packId: 'geometry-figures' },
  })
  check('duplicate install is refused', reinstall.status === 400, `status=${reinstall.status}`)

  // ── Import / export ─────────────────────────────────────────
  console.log('\nImport / export flow:')
  const qti = `<?xml version="1.0" encoding="UTF-8"?>
<questestinterop xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1">
  <assessmentItem identifier="Q1" title="Capital of France">
    <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="identifier">
      <correctResponse><value>A</value></correctResponse>
    </responseDeclaration>
    <itemBody>
      <p>What is the capital of France?</p>
      <choiceInteraction responseIdentifier="RESPONSE" maxChoices="1">
        <simpleChoice identifier="A">Paris</simpleChoice>
        <simpleChoice identifier="B">Lyon</simpleChoice>
        <simpleChoice identifier="C">Marseille</simpleChoice>
      </choiceInteraction>
    </itemBody>
  </assessmentItem>
  <assessmentItem identifier="Q2" title="True or false">
    <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="identifier">
      <correctResponse><value>True</value></correctResponse>
    </responseDeclaration>
    <itemBody>
      <p>The Earth orbits the Sun.</p>
      <choiceInteraction responseIdentifier="RESPONSE" maxChoices="1">
        <simpleChoice identifier="True">True</simpleChoice>
        <simpleChoice identifier="False">False</simpleChoice>
      </choiceInteraction>
    </itemBody>
  </assessmentItem>
  <assessmentItem identifier="Q3" title="Spell it">
    <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="string">
      <correctResponse><value>mitochondria</value></correctResponse>
    </responseDeclaration>
    <itemBody>
      <p>The powerhouse of the cell is the ___.</p>
      <textEntryInteraction responseIdentifier="RESPONSE" expectedLength="20"/>
    </itemBody>
  </assessmentItem>
  <assessmentItem identifier="Q4" title="Match these">
    <responseDeclaration identifier="RESPONSE" cardinality="multiple" baseType="directedPair">
      <correctResponse><value>A B</value></correctResponse>
    </responseDeclaration>
    <itemBody>
      <p>Match the pairs.</p>
      <matchInteraction responseIdentifier="RESPONSE">
        <simpleMatchSet><simpleAssociableChoice identifier="A" matchMax="1">One</simpleAssociableChoice></simpleMatchSet>
      </matchInteraction>
    </itemBody>
  </assessmentItem>
</questestinterop>`

  const importTarget = await api('/quizzes', {
    method: 'POST',
    token: teacherToken,
    body: { title: 'QTI Import Bin', subject: 'Science', difficulty: 'easy' },
  })
  const qtiImport = await api(`/import/qti`, {
    method: 'POST',
    token: teacherToken,
    body: { quizId: importTarget.data.quiz.id, xml: qti },
  })
  check(
    'QTI import keeps supported interactions',
    qtiImport.status === 201 && qtiImport.data.imported === 3,
    JSON.stringify(qtiImport.data),
  )
  check(
    'QTI import reports unsupported ones',
    qtiImport.data.skipped?.length === 1 &&
      /match/i.test(qtiImport.data.skipped[0].reason),
    JSON.stringify(qtiImport.data.skipped),
  )

  const csvResponse = await fetch(
    `${BASE}/api/export/attempts.csv?quizId=${quizId}`,
    { headers: { Authorization: `Bearer ${teacherToken}` } },
  )
  const csvText = await csvResponse.text()
  check(
    'CSV export streams finished attempts',
    csvResponse.ok &&
      csvResponse.headers.get('content-type')?.includes('text/csv') &&
      csvText.includes('Student,Email,Quiz,Score') &&
      csvText.split('\n').length >= 2,
    `status=${csvResponse.status}`,
  )

  const backupResponse = await fetch(`${BASE}/api/export/backup`, {
    headers: { Authorization: `Bearer ${teacherToken}` },
  })
  const backup = await backupResponse.json()
  check(
    'backup exports content',
    backupResponse.ok &&
      backup.format === 'openpath-backup' &&
      Array.isArray(backup.quizzes) &&
      backup.quizzes.length >= 1,
  )

  const restore = await api('/import/restore', {
    method: 'POST',
    token: teacherToken,
    body: { backup },
  })
  check(
    'restore recreates quizzes as drafts',
    restore.status === 201 &&
      restore.data.quizzes?.length === backup.quizzes.length &&
      restore.data.quizzes.every((quiz) => !quiz.published),
    `status=${restore.status}`,
  )

  const deleted = await api(`/assignments/${assignmentId}`, {
    method: 'DELETE',
    token: teacherToken,
  })
  check('assignment deleted', deleted.status === 204)

  // ── Classroom economy ───────────────────────────────────────
  console.log('\nClassroom economy flow:')

  // A fresh student keeps the math deterministic.
  const econEmail = `econ-${Date.now()}@openpath.dev`
  const registered = await api('/auth/register', {
    method: 'POST',
    body: { email: econEmail, name: 'Econ Tester', password: 'test1234', role: 'student' },
  })
  check('registers a fresh student', registered.status === 201 && registered.data.token)
  const econToken = registered.data.token

  // Teacher configures a level-2 coin reward.
  const economyBefore = await api('/economy/mine', { token: teacherToken })
  const rewardsSet = await api('/economy/rewards', {
    method: 'PUT',
    token: teacherToken,
    body: { rewards: [{ level: 2, rewardType: 'coins', coins: 50 }] },
  })
  check('teacher sets a level reward', rewardsSet.status === 200 && rewardsSet.data.rewards.length === 1)

  const econStart = await api('/attempts', {
    method: 'POST',
    token: econToken,
    body: { quizId },
  })
  check('fresh student starts the quiz', econStart.status === 201)
  for (const [index, response] of [[0, 0], [1, [0, 1, 2]], [2, 4.5]]) {
    await api(`/attempts/${econStart.data.attemptId}/answer`, {
      method: 'POST',
      token: econToken,
      body: {
        questionId: econStart.data.questions[index].id,
        response,
        msTaken: 1500,
      },
    })
  }
  const econFinish = await api(`/attempts/${econStart.data.attemptId}/finish`, {
    method: 'POST',
    token: econToken,
  })
  check('perfect run mints coins', econFinish.data.coinsEarned?.amount >= 3, JSON.stringify(econFinish.data.coinsEarned))
  check(
    'level reward granted on level-up',
    Array.isArray(econFinish.data.levelRewards) &&
      econFinish.data.levelRewards.some((reward) => reward.level === 2 && reward.coins === 50),
    JSON.stringify(econFinish.data.levelRewards),
  )

  const econShop = await api('/economy/shop', { token: econToken })
  check(
    'wallet reflects earnings plus reward',
    econShop.data.coins === (econFinish.data.coinsEarned?.amount ?? 0) + 50,
    `coins=${econShop.data.coins}`,
  )

  // Teacher stocks test items; the student sees them in the shop.
  const cheapItem = await api('/economy/items', {
    method: 'POST',
    token: teacherToken,
    body: {
      name: 'Test Background',
      description: 'Smoke-test solid',
      category: 'background',
      price: 2,
      itemData: { type: 'solid', color: '#123456' },
    },
  })
  check('teacher creates a shop item', cheapItem.status === 201 && cheapItem.data.item?.id)
  const cheapItemId = cheapItem.data.item.id

  const richItem = await api('/economy/items', {
    method: 'POST',
    token: teacherToken,
    body: {
      name: 'Way Too Rich',
      description: 'Deliberately unaffordable',
      category: 'nameplate',
      price: 99999,
      itemData: { type: 'gradient', from: '#f59e0b', to: '#ef4444', direction: 'north-south' },
    },
  })
  check('teacher creates a pricey item', richItem.status === 201 && richItem.data.item?.id)
  const richItemId = richItem.data.item?.id

  const shopAfterStocking = await api('/economy/shop', { token: econToken })
  check(
    'shop lists stocked items',
    shopAfterStocking.data.items.some((item) => item.id === cheapItemId) &&
      shopAfterStocking.data.items.some((item) => item.id === richItemId),
  )

  const bought = await api(`/economy/shop/${cheapItemId}/buy`, {
    method: 'POST',
    token: econToken,
  })
  check(
    'purchase spends coins and equips',
    bought.status === 200 &&
      bought.data.coins === econShop.data.coins - 2 &&
      JSON.stringify(bought.data.item.itemData) === JSON.stringify({ type: 'solid', color: '#123456' }),
    `coins=${bought.data.coins}`,
  )

  const rebuy = await api(`/economy/shop/${cheapItemId}/buy`, {
    method: 'POST',
    token: econToken,
  })
  check('double purchase refused', rebuy.status === 400, `status=${rebuy.status}`)

  const broke = await api(`/economy/shop/${richItemId}/buy`, {
    method: 'POST',
    token: econToken,
  })
  check('cannot buy beyond the wallet', broke.status === 400, `status=${broke.status}`)

  const unequipped = await api('/economy/unequip', {
    method: 'POST',
    token: econToken,
    body: { category: 'background' },
  })
  check('unequip resets the slot', unequipped.status === 200)

  // Restore the teacher's previous rewards and drop the test items.
  await api('/economy/rewards', {
    method: 'PUT',
    token: teacherToken,
    body: {
      rewards: (economyBefore.data.rewards ?? []).map((reward) => ({
        level: reward.level,
        rewardType: reward.rewardType,
        coins: reward.coins,
        itemId: reward.itemId,
      })),
    },
  })
  await api(`/economy/items/${cheapItemId}`, { method: 'DELETE', token: teacherToken })
  await api(`/economy/items/${richItemId}`, { method: 'DELETE', token: teacherToken })

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

  // ── Expanded STEM Parametric Figures (8 new templates) ───────
  console.log('\nExpanded STEM parametric figures:')
  const stemQuiz = await api('/quizzes', {
    method: 'POST',
    token: teacherToken,
    body: {
      title: 'STEM Parametric Verification',
      subject: 'Physics',
      difficulty: 'medium',
      description: 'Validates all 8 STEM/Econ/Stats figure solvers.',
    },
  })
  const stemQuizId = stemQuiz.data.quiz?.id
  const newFigureSpecs = [
    {
      name: 'coordinate-line',
      figure: { template: 'coordinate-line', givens: { x1: -2, y1: 1, x2: 4, y2: 10 }, ask: 'slope', rounding: 'tenth' },
      expected: 1.5,
    },
    {
      name: 'parabola-vertex',
      figure: { template: 'parabola-vertex', givens: { a: 2, b: -12, c: 10 }, ask: 'vertexX', rounding: 'integer' },
      expected: 3,
    },
    {
      name: 'unit-circle',
      figure: { template: 'unit-circle', givens: { angleDeg: 60 }, ask: 'cos', rounding: 'tenth' },
      expected: 0.5,
    },
    {
      name: 'vector-2d',
      figure: { template: 'vector-2d', givens: { ux: 6, uy: 0, vx: 0, vy: 8 }, ask: 'resultantMag', rounding: 'integer' },
      expected: 10,
    },
    {
      name: 'inclined-plane',
      figure: { template: 'inclined-plane', givens: { mass: 10, angle: 30, mu: 0.2 }, ask: 'normalForce', rounding: 'tenth' },
      expected: 84.9,
    },
    {
      name: 'series-parallel-circuit',
      figure: { template: 'series-parallel-circuit', givens: { voltage: 24, r1: 4, r2: 6, r3: 12 }, ask: 'totalCurrent', rounding: 'integer' },
      expected: 3,
    },
    {
      name: 'supply-demand',
      figure: { template: 'supply-demand', givens: { demandIntercept: 100, demandSlope: 2, supplyIntercept: 20, supplySlope: 2, tax: 16 }, ask: 'deadweightLoss', rounding: 'integer' },
      expected: 32,
    },
    {
      name: 'normal-curve',
      figure: { template: 'normal-curve', givens: { mean: 100, sd: 15, x: 130 }, ask: 'zScore', rounding: 'tenth' },
      expected: 2.0,
    },
  ]

  for (const item of newFigureSpecs) {
    const added = await api(`/quizzes/${stemQuizId}/questions`, {
      method: 'POST',
      token: teacherToken,
      body: {
        type: 'figure',
        prompt: `Solve ${item.name}`,
        figure: item.figure,
        points: 10,
      },
    })
    check(
      `solver computes ${item.name}`,
      added.status === 201 && Math.abs(added.data.question?.correct - item.expected) < 0.1,
      `got=${added.data.question?.correct} expected=${item.expected}`,
    )
  }

  // ── Educational Arcade (6 modes + 120 daily cap) ─────────────
  console.log('\nEducational Arcade flow:')
  const arcadeTeacherDenied = await api('/arcade/summary', { token: teacherToken })
  check('arcade summary enforces student role', arcadeTeacherDenied.status === 403)

  const arcadeSummary = await api('/arcade/summary', { token: studentToken })
  check(
    'arcade summary serves 120 daily coin cap',
    arcadeSummary.status === 200 && arcadeSummary.data.dailyCap === 120,
    JSON.stringify(arcadeSummary.data),
  )

  for (const mode of [
    'streak-siege',
    'speed-match',
    'step-detective',
    'sim-sandbox',
    'sequence-architect',
    'boss-raid',
    'certainty-vault',
    'diagram-scout',
    'cloze-workbench',
    'knowledge-bastion',
  ]) {
    const runRes = await api('/arcade/runs', {
      method: 'POST',
      token: studentToken,
      body: {
        mode,
        correct: 6,
        attempts: 7,
        bestCombo: 5,
        comboBursts: 1,
        score: 950,
        durationMs: 12000,
        qualityScore: 88,
        deepUnits: 4,
        confidentHits: 3,
      },
    })
    check(
      `arcade ${mode} credits coins`,
      runRes.status === 201 && typeof runRes.data.balance === 'number' && runRes.data.dailyCap === 120,
      JSON.stringify(runRes.data),
    )
  }

  // ── Guided Lessons & Co-op Race Modes ───────────────────────
  console.log('\nGuided Lessons & Co-op Race flow:')
  const tracksRes = await api('/tracks', { token: studentToken })
  check(
    'tracks endpoint serves 32 curriculum tracks',
    tracksRes.status === 200 && tracksRes.data.tracks?.length === 32,
    `got=${tracksRes.data.tracks?.length}`,
  )
  for (const [slug, lessonCount] of [
    ['physics-foundations', 7],
    ['media-ai-literacy', 6],
    ['general-chemistry-core', 6],
    ['environmental-science-climate', 6],
    ['anatomy-physiology', 7],
    ['human-geography', 6],
    ['corporate-finance', 3],
    ['data-analytics', 3],
    ['world-history-civilizations', 3],
    ['us-civics-constitution', 3],
    ['english-rhetoric-composition', 3],
    ['conversational-spanish', 3],
    ['middle-school-science', 6],
    ['probability-statistics', 5],
    ['french-starter', 3],
    ['german-starter', 3],
    ['mandarin-starter', 3],
  ]) {
    const track = tracksRes.data.tracks?.find((t) => t.slug === slug)
    const lessons = track?.units?.flatMap((u) => u.lessons ?? []) ?? []
    check(`track ${slug} serves ${lessonCount} lessons`, lessons.length === lessonCount, `got=${lessons.length}`)
  }
  const allLessonIds = (tracksRes.data.tracks ?? []).flatMap((t) =>
    (t.units ?? []).flatMap((u) => (u.lessons ?? []).map((l) => l.id)),
  )
  const repeatedLessonIds = [...new Set(allLessonIds.filter((id, i) => allLessonIds.indexOf(id) !== i))]
  check(
    'lesson ids are unique across all tracks',
    allLessonIds.length > 0 && repeatedLessonIds.length === 0,
    `repeated=${repeatedLessonIds.join(',')}`,
  )
  const firstLessonId = tracksRes.data.tracks?.[0]?.units?.[0]?.lessons?.[0]?.id
  const lessonRes = await api(`/lessons/${firstLessonId}`, { token: studentToken })
  check(
    'lesson detail serves interactive steps',
    lessonRes.status === 200 && lessonRes.data.lesson?.steps?.length >= 5,
    `steps=${lessonRes.data.lesson?.steps?.length}`,
  )
  const progRes = await api(`/lessons/${firstLessonId}/progress`, {
    method: 'POST',
    token: studentToken,
    body: {
      currentStepIndex: lessonRes.data.lesson.steps.length - 1,
      completed: true,
      checkpointScore: 100,
      timeSpentSec: 180,
    },
  })
  check(
    'completing lesson promotes mastery and enrolls FSRS flashcards',
    progRes.status === 200 &&
      progRes.data.progress?.completed === true &&
      typeof progRes.data.enrolledFlashcards === 'number',
    JSON.stringify(progRes.data),
  )

  for (const raceMode of ['squad-sync', 'classroom-siege']) {
    const raceCreated = await api('/races', {
      method: 'POST',
      token: teacherToken,
      body: { quizId: stemQuizId, mode: raceMode, squadSize: 3 },
    })
    const raceInfo = await api(`/races/${raceCreated.data.code}`, { token: teacherToken })
    check(
      `creates ${raceMode} live race room`,
      raceCreated.status === 201 && raceInfo.status === 200 && raceInfo.data.room?.mode === raceMode,
      JSON.stringify(raceInfo.data),
    )
  }

  console.log(`\n${failed === 0 ? '🎉' : '💥'} ${passed} passed, ${failed} failed\n`)
  process.exit(failed === 0 ? 0 : 1)
}

main().catch((error) => {
  console.error('Smoke test crashed:', error)
  process.exit(1)
})
