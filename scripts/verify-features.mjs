// One-off verification for the two new features (AI kill switch, work
// notifications). Run against a booted server: `pnpm test:features`
// (defaults to the local dev port) or pass a baseUrl.
const BASE = process.argv[2] ?? 'http://localhost:8787'

let passed = 0
let failed = 0
const check = (name, condition, detail = '') => {
  if (condition) {
    passed += 1
    console.log(`  ✓ ${name}`)
  } else {
    failed += 1
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

async function api(path, { method = 'GET', body, token } = {}) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

async function login(email, password) {
  const res = await api('/auth/login', { method: 'POST', body: { email, password } })
  if (!res.data.token) throw new Error(`login failed: ${JSON.stringify(res.data)}`)
  return res.data.token
}

async function main() {
  const teacher = await login('ada.lovelace@openpath.dev', 'teach1234')
  const student = await login('grace.hopper@openpath.dev', 'learn1234')

  // ── Teacher makes homework, student finishes it ───────────────────────
  console.log('Work-completion notifications:')
  const created = await api('/quizzes', {
    method: 'POST',
    token: teacher,
    body: {
      title: 'Fraction Foundations',
      subject: 'Math',
      difficulty: 'easy',
      kind: 'homework',
      description: 'Homework for the notification test.',
    },
  })
  check('teacher creates homework quiz', created.status === 201 && created.data.quiz?.id)
  const quizId = created.data.quiz.id

  const q = await api(`/quizzes/${quizId}/questions`, {
    method: 'POST',
    token: teacher,
    body: {
      type: 'mcq',
      prompt: 'What is 1/2 + 1/2?',
      options: ['1', '2', '1/4', '3/4'],
      correct: 0,
      explanation: 'Two halves make a whole.',
      points: 10,
    },
  })
  check('adds question', q.status === 201)

  const published = await api(`/quizzes/${quizId}/publish`, { method: 'POST', token: teacher })
  check('publishes quiz', published.status === 200)

  const started = await api('/attempts', {
    method: 'POST',
    token: student,
    body: { quizId },
  })
  check('student starts attempt', started.status === 201 && started.data.attemptId)
  const attemptId = started.data.attemptId
  const questionId = started.data.questions[0].id

  const answered = await api(`/attempts/${attemptId}/answer`, {
    method: 'POST',
    token: student,
    body: { questionId, response: 0, msTaken: 2000 },
  })
  check('student answers', answered.status === 201, `status=${answered.status} ${JSON.stringify(answered.data)}`)

  const finished = await api(`/attempts/${attemptId}/finish`, { method: 'POST', token: student })
  check('student finishes', finished.status === 200)

  const before = await api('/notifications/unread-count', { token: teacher })
  check('teacher bell shows unread', before.data.unread === 1, JSON.stringify(before.data))

  const feed = await api('/notifications', { token: teacher })
  const item = (feed.data.notifications ?? [])[0]
  check('teacher feed has work_completed', item?.type === 'work_completed', JSON.stringify(item))
  check('feed mentions the quiz title', (item?.body ?? '').includes('Fraction Foundations'), JSON.stringify(item))
  check('feed mentions the student', (item?.title ?? '').includes('Grace Hopper'))
  check('notification starts unread', item?.read === false)

  const readOne = await api(`/notifications/${item.id}/read`, { method: 'POST', token: teacher })
  check('mark one read', readOne.data.read === true)
  const after = await api('/notifications/unread-count', { token: teacher })
  check('unread drops to 0', after.data.unread === 0)

  const readAll = await api('/notifications/read-all', { method: 'POST', token: teacher })
  check('mark-all-read is idempotent', readAll.data.read === true)

  // ── AI kill switch ────────────────────────────────────────────────────
  console.log('AI kill switch:')
  const statusBefore = await api('/ai/status', { token: teacher })
  check('status reports enabled', statusBefore.data.status?.enabled === true)

  const off = await api('/ai/settings', {
    method: 'PUT',
    token: teacher,
    body: { provider: 'local', baseUrl: 'http://localhost:11434/v1', model: 'qwen3:8b', enabled: false },
  })
  check('teacher turns AI off', off.data.status?.enabled === false)

  const statusOff = await api('/ai/status', { token: teacher })
  check('status now reports disabled', statusOff.data.status?.enabled === false)

  const blocked = await api('/ai/generate', {
    method: 'POST',
    token: teacher,
    body: { topic: 'photosynthesis', count: 2, types: ['mcq'] },
  })
  check('generate is refused while off', blocked.status === 403, `status=${blocked.status}`)
  check('refusal explains why', /AI features are turned off/i.test(blocked.data?.error ?? ''))

  const on = await api('/ai/settings', {
    method: 'PUT',
    token: teacher,
    body: { provider: 'local', baseUrl: 'http://localhost:11434/v1', model: 'qwen3:8b', enabled: true },
  })
  check('teacher turns AI back on', on.data.status?.enabled === true)

  // ── Non-teacher sees read-only state ──────────────────────────────────
  console.log('Parent visibility:')
  const studentStatus = await api('/ai/status', { token: student })
  check('student can read AI state', studentStatus.data.status?.enabled === true)
  const studentToggle = await api('/ai/settings', {
    method: 'PUT',
    token: student,
    body: { provider: 'local', baseUrl: 'http://localhost:11434/v1', model: 'qwen3:8b', enabled: false },
  })
  check('student cannot flip the switch', studentToggle.status === 403, `status=${studentToggle.status}`)

  console.log(`\n${failed === 0 ? '🎉' : '❌'} ${passed} passed, ${failed} failed`)
  process.exit(failed === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error('verification crashed:', err)
  process.exit(1)
})
