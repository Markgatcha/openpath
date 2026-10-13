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
  check('pack registry serves packs', Boolean(geometryPack))
  check(
    'geometry pack advertises two quizzes',
    geometryPack?.quizzes?.length === 2,
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
      installed.data.quizzes?.length === 2 &&
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

  console.log(`\n${failed === 0 ? '🎉' : '💥'} ${passed} passed, ${failed} failed\n`)
  process.exit(failed === 0 ? 0 : 1)
}

main().catch((error) => {
  console.error('Smoke test crashed:', error)
  process.exit(1)
})
