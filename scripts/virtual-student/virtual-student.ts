/**
 * Virtual-student harness: run calibrated synthetic learners through
 * OpenPath's real quiz pipeline and report where they struggle.
 *
 *   node --import tsx scripts/virtual-student/virtual-student.ts [options]
 *
 * Options:
 *   --base <url>             API base (default http://localhost:8787)
 *   --seed <n>               RNG seed — same seed + content reproduces a run
 *   --days <n>               simulated days (default 14)
 *   --per-persona <n>        students per persona archetype (default 3)
 *   --max-attempts <n>       cap per quiz per student (default 3)
 *   --teacher <email:pass>   teacher account used to read answer keys
 *   --classroom-code <code>  join this classroom so its quizzes are visible
 *                            (default ROOM42; pass empty string to skip)
 *   --subjects <csv>         only run quizzes in these subjects
 *   --llm / --no-llm         force LLM wrong-answer texture on/off
 *                            (default: on when OPENROUTER_API_KEY or
 *                            LOCAL_AI_BASE_URL is set)
 *   --out <dir>              report output directory
 *
 * How it works: a learner model (see model.ts) calibrated to real
 * student data decides WHETHER each answer is right; the answer itself
 * is then produced — correct answers from the teacher-visible key,
 * wrong ones from LLM texture (misconception-driven) or statistical
 * fallback. Students never see keys through the student API; keys are
 * read through the teacher account purely as a test oracle. Learning
 * happens through the real feedback loop: graded correctness plus the
 * explanation the server returns.
 */
import { randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  computeAnswer,
  figureSeed,
  roundValue,
  sampleFigure,
  toleranceFor,
  type FigureSpec,
} from '../../shared/figure.ts'
import {
  mulberry32,
  PERSONAS,
  VirtualLearner,
  type Persona,
  type Rng,
} from './model.ts'
import {
  chooseWrongAnswers,
  resolveLlmConfig,
  type TextureQuestion,
  type TextureResult,
} from './llm.ts'
import {
  aggregate,
  renderMarkdown,
  type AnswerRecord,
} from './report.ts'

// ── CLI ────────────────────────────────────────────────────────

interface CliOptions {
  base: string
  seed: number
  days: number
  perPersona: number
  maxAttempts: number
  teacher: string
  classroomCode: string
  subjects: string[] | null
  llm: boolean
  outDir: string
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    base: 'http://localhost:8787',
    seed: 42,
    days: 14,
    perPersona: 3,
    maxAttempts: 3,
    teacher: 'ada.lovelace@openpath.dev:teach1234',
    classroomCode: 'ROOM42',
    subjects: null,
    llm: resolveLlmConfig() !== null,
    outDir: join(process.cwd(), 'scripts', 'virtual-student', 'out'),
  }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    const next = () => argv[(i += 1)]
    switch (arg) {
      case '--base':
        opts.base = next()
        break
      case '--seed':
        opts.seed = Number(next())
        break
      case '--days':
        opts.days = Number(next())
        break
      case '--per-persona':
        opts.perPersona = Number(next())
        break
      case '--max-attempts':
        opts.maxAttempts = Number(next())
        break
      case '--teacher':
        opts.teacher = next()
        break
      case '--classroom-code':
        opts.classroomCode = next()
        break
      case '--subjects':
        opts.subjects = next().split(',').map((s) => s.trim())
        break
      case '--llm':
        opts.llm = true
        break
      case '--no-llm':
        opts.llm = false
        break
      case '--out':
        opts.outDir = next()
        break
      default:
        throw new Error(`unknown argument: ${arg}`)
    }
  }
  return opts
}

// ── API client ─────────────────────────────────────────────────

// Responses vary per endpoint; callers know the shapes they need.
// oxlint-disable-next-line typescript/no-explicit-any
type ApiData = any

interface Api {
  call(
    path: string,
    init?: { method?: string; body?: unknown; token?: string },
  ): Promise<{ status: number; data: ApiData }>
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function makeApi(base: string): Api {
  return {
    async call(path, { method = 'GET', body, token } = {}) {
      const headers: Record<string, string> = {}
      if (body !== undefined) headers['Content-Type'] = 'application/json'
      if (token) headers.Authorization = `Bearer ${token}`

      // The server rate-limits at 300 req/min; a full simulation makes
      // thousands of calls. Back off and retry instead of failing the run.
      let waitMs = 5_000
      for (let retry = 0; ; retry += 1) {
        const response = await fetch(`${base}/api${path}`, {
          method,
          headers,
          ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        })
        const data = await response.json().catch(() => ({}))
        if (response.status !== 429 || retry >= 12) {
          return { status: response.status, data }
        }
        await sleep(waitMs)
        waitMs = Math.min(70_000, waitMs * 1.5)
      }
    },
  }
}

async function login(api: Api, email: string, password: string): Promise<string> {
  const result = await api.call('/auth/login', {
    method: 'POST',
    body: { email, password },
  })
  if (!result.data.token) {
    throw new Error(`login failed for ${email}: ${JSON.stringify(result.data)}`)
  }
  return result.data.token as string
}

/** Register, or fall back to login when the account already exists. */
async function registerOrLogin(
  api: Api,
  email: string,
  name: string,
  password: string,
): Promise<string> {
  const registered = await api.call('/auth/register', {
    method: 'POST',
    body: { email, name, password, role: 'student' },
  })
  if (registered.data.token) return registered.data.token as string
  return login(api, email, password)
}

// ── Teacher-oracle content ─────────────────────────────────────

interface HarnessQuestion {
  id: string
  type: string
  prompt: string
  options: string[] | null
  figure: FigureSpec | null
  correct: number | boolean | string | number[]
  points: number
  explanation: string
}

interface HarnessQuiz {
  id: string
  title: string
  subject: string
  difficulty: string
  timeLimitSec: number | null
  questions: HarnessQuestion[]
}

async function loadContent(api: Api, teacherToken: string): Promise<HarnessQuiz[]> {
  const list = await api.call('/quizzes', { token: teacherToken })
  const quizzes: HarnessQuiz[] = []
  for (const quiz of list.data.quizzes ?? []) {
    const detail = await api.call(`/quizzes/${quiz.id}`, { token: teacherToken })
    if (!detail.data.questions) continue
    quizzes.push({
      id: quiz.id,
      title: quiz.title,
      subject: quiz.subject,
      difficulty: quiz.difficulty,
      timeLimitSec: quiz.timeLimitSec ?? null,
      questions: detail.data.questions,
    })
  }
  return quizzes
}

// ── Response construction ──────────────────────────────────────

/** The exact key for a figure question in this attempt (variants included). */
function figureKey(question: HarnessQuestion, attemptId: string): number {
  const spec = question.figure!
  if (spec.ranges && Object.keys(spec.ranges).length > 0) {
    const concrete = sampleFigure(spec, figureSeed(question.id, attemptId))
    return computeAnswer(concrete)
  }
  return question.correct as number
}

const CANNED_WRONG_FILL = [
  'not sure',
  'idk',
  'I forgot',
  'none',
  'yes',
]

/** Wrong-order responses: adjacent swaps — how real ordering errors look. */
function scrambledOrder(correct: number[], intensity: number, rng: Rng): number[] {
  const arr = [...correct]
  const swaps = Math.min(arr.length - 1, 1 + Math.floor(intensity * 2 + rng()))
  for (let s = 0; s < swaps; s += 1) {
    const i = Math.floor(rng() * (arr.length - 1))
    ;[arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
  }
  return arr.every((v, i) => v === correct[i]) && arr.length > 1
    ? scrambledOrder(correct, intensity + 0.5, rng)
    : arr
}

/** Wrong figure responses: realistic numeric slips, outside tolerance. */
function wrongFigureValue(key: number, spec: FigureSpec, rng: Rng): number {
  const tolerance = toleranceFor(spec.rounding)
  for (let tries = 0; tries < 8; tries += 1) {
    const mode = rng()
    let value: number
    if (mode < 0.45) {
      // Careless arithmetic: proportional error 8–35%.
      const magnitude = 0.08 + rng() * 0.27
      value = key * (1 + (rng() < 0.5 ? -magnitude : magnitude))
    } else if (mode < 0.7 && Math.abs(key) < 30) {
      // Structural slip, e.g. forgetting a final square root.
      value = key * key
    } else {
      // Unit/rounding confusion: truncate instead of round, or shift magnitude.
      value = rng() < 0.5 ? Math.trunc(key * 10) / 10 : key * 10
    }
    const rounded = roundValue(key, spec.rounding)
    if (
      Math.abs(value - key) > tolerance &&
      Math.abs(value - rounded) > tolerance
    ) {
      return Math.round(value * 1000) / 1000
    }
  }
  return Math.round((key + 3 * tolerance + 1) * 1000) / 1000
}

function correctResponse(
  question: HarnessQuestion,
  attemptId: string,
): number | boolean | string | number[] {
  switch (question.type) {
    case 'mcq':
      return question.correct as number
    case 'truefalse':
      return question.correct as boolean
    case 'fill':
      return question.correct as string
    case 'order':
      return question.correct as number[]
    default:
      return roundValue(figureKey(question, attemptId), question.figure!.rounding)
  }
}

function wrongResponse(
  question: HarnessQuestion,
  attemptId: string,
  texture: TextureResult | undefined,
  effectiveMastery: number,
  rng: Rng,
): number | boolean | string | number[] {
  switch (question.type) {
    case 'mcq': {
      const correctIndex = question.correct as number
      if (texture?.kind === 'mcq') return texture.wrongIndex
      const pool = question.options!.map((_, i) => i).filter((i) => i !== correctIndex)
      return pool[Math.floor(rng() * pool.length)]
    }
    case 'truefalse':
      return !(question.correct as boolean)
    case 'fill':
      if (texture?.kind === 'fill') return texture.wrongText
      return CANNED_WRONG_FILL[Math.floor(rng() * CANNED_WRONG_FILL.length)]
    case 'order':
      return scrambledOrder(question.correct as number[], 1 - effectiveMastery, rng)
    default:
      return wrongFigureValue(figureKey(question, attemptId), question.figure!, rng)
  }
}

function summarizeResponse(type: string, response: unknown, options: string[] | null): string {
  if (type === 'mcq' && typeof response === 'number' && options) {
    return `option ${response}: "${options[response] ?? '?'}"`
  }
  if (typeof response === 'string') {
    return response.length > 40 ? `${response.slice(0, 37)}…` : response
  }
  return JSON.stringify(response)
}

// ── Simulation ─────────────────────────────────────────────────

interface WorkItem {
  quiz: HarnessQuiz
  attemptNumber: number
  dueDay: number
}

interface StudentRun {
  token: string
  studentId: string
  persona: Persona
  learner: VirtualLearner
  rng: Rng
}

async function runAttempt(
  api: Api,
  student: StudentRun,
  quiz: HarnessQuiz,
  attemptNumber: number,
  day: number,
  textureCache: Map<string, TextureResult>,
  llmConfig: ReturnType<typeof resolveLlmConfig>,
  records: AnswerRecord[],
): Promise<number | null> {
  const started = await api.call('/attempts', {
    method: 'POST',
    token: student.token,
    body: { quizId: quiz.id },
  })
  if (!started.data.attemptId) {
    console.warn(
      `  ! attempt blocked on "${quiz.title}": ${JSON.stringify(started.data)}`,
    )
    return null
  }
  const attemptId = started.data.attemptId as string
  const studentQuestions = started.data.questions as {
    id: string
    type: string
    options: string[] | null
  }[]
  const byId = new Map(quiz.questions.map((q) => [q.id, q]))

  // LLM texture prefetch: one batched call covering every mcq/fill
  // question in the quiz. Misconceptions are persona-level, so this is
  // independent of what any individual student ends up sampling — and it
  // keeps correctness decisions free to interleave with grading below.
  if (llmConfig && !textureCache.has('__disabled__')) {
    const needed: TextureQuestion[] = []
    for (const sq of studentQuestions) {
      const question = byId.get(sq.id)!
      const cacheKey = `${student.persona.key}:${question.id}`
      if (textureCache.has(cacheKey)) continue
      if (question.type === 'mcq') {
        needed.push({
          questionId: question.id,
          type: 'mcq',
          prompt: question.prompt,
          options: question.options ?? [],
          correctIndex: question.correct as number,
        })
      } else if (question.type === 'fill') {
        needed.push({
          questionId: question.id,
          type: 'fill',
          prompt: question.prompt,
        })
      }
    }
    if (needed.length > 0) {
      try {
        const texture = await chooseWrongAnswers(
          llmConfig,
          student.persona.llmProfile,
          needed,
        )
        for (const [questionId, result] of texture) {
          textureCache.set(`${student.persona.key}:${questionId}`, result)
        }
      } catch (error) {
        console.warn(
          `  ! LLM texture failed, using statistical fallback: ${String(error)}`,
        )
        // Disable for the rest of the run: one failure means the endpoint is down.
        textureCache.set('__disabled__', { kind: 'fill', wrongText: '' })
      }
    }
  }
  const textureDisabled = textureCache.has('__disabled__')

  // Submit answers through the real grading pipeline, in order. Like a
  // real student, the virtual student sees correctness + explanation
  // immediately after each answer — so mastery updates BEFORE the next
  // question is decided.
  let correctCount = 0
  // Timed quizzes expire mid-attempt in the real client; the student
  // stops wherever the countdown runs out and unanswered questions score 0.
  const limitMs = quiz.timeLimitSec ? quiz.timeLimitSec * 1000 : null
  let elapsedMs = 0
  for (const sq of studentQuestions) {
    if (limitMs !== null && elapsedMs >= limitMs) break
    const question = byId.get(sq.id)!
    const optionCount =
      sq.type === 'mcq' || sq.type === 'order'
        ? (sq.options?.length ?? 2)
        : 0
    const decision = student.learner.decide(
      quiz.subject,
      quiz.difficulty,
      sq.type,
      optionCount,
      day,
    )

    const cacheKey = `${student.persona.key}:${question.id}`
    const texture = textureDisabled ? undefined : textureCache.get(cacheKey)
    const response = decision.correct
      ? correctResponse(question, attemptId)
      : wrongResponse(
          question,
          attemptId,
          texture,
          decision.effectiveMastery,
          student.rng,
        )

    const answered = await api.call(`/attempts/${attemptId}/answer`, {
      method: 'POST',
      token: student.token,
      body: {
        questionId: sq.id,
        response,
        msTaken: decision.msTaken,
        ...(decision.confidence ? { confidence: decision.confidence } : {}),
      },
    })
    const serverCorrect = answered.data.correct === true
    if (serverCorrect) correctCount += 1
    elapsedMs += decision.msTaken

    // The model's sampled outcome and the server's grading should agree;
    // a mismatch means the oracle key drifted (definitely worth logging).
    if (serverCorrect !== decision.correct) {
      console.warn(
        `  ! grading mismatch on "${quiz.title}" q=${sq.id.slice(0, 8)} ` +
          `type=${sq.type}: model=${decision.correct} server=${serverCorrect}`,
      )
    }

    const readExplanation = student.learner.readsExplanation(serverCorrect)
    student.learner.learnFromFeedback(
      quiz.subject,
      serverCorrect,
      readExplanation,
      day,
    )

    records.push({
      studentId: student.studentId,
      persona: student.persona.key,
      quizId: quiz.id,
      quizTitle: quiz.title,
      subject: quiz.subject,
      difficulty: quiz.difficulty,
      questionId: sq.id,
      prompt: question.prompt,
      type: sq.type,
      attemptNumber,
      day,
      correct: serverCorrect,
      msTaken: decision.msTaken,
      confidence: decision.confidence,
      effectiveMastery: decision.effectiveMastery,
      masteryAfter:
        student.learner.skillSnapshot()[quiz.subject]?.mastery ?? 0,
      readExplanation,
      responseSummary: summarizeResponse(sq.type, response, question.options),
      correctSummary: summarizeResponse(
        sq.type,
        correctResponse(question, attemptId),
        question.options,
      ),
    })
  }

  await api.call(`/attempts/${attemptId}/finish`, {
    method: 'POST',
    token: student.token,
  })
  return correctCount / studentQuestions.length
}

async function simulateStudent(
  api: Api,
  student: StudentRun,
  quizzes: HarnessQuiz[],
  opts: CliOptions,
  textureCache: Map<string, TextureResult>,
  llmConfig: ReturnType<typeof resolveLlmConfig>,
  records: AnswerRecord[],
  trajectories: Record<string, Record<string, number>[]>,
): Promise<void> {
  // Initial schedule: spread first passes across the early days.
  const queue: WorkItem[] = quizzes.map((quiz, index) => ({
    quiz,
    attemptNumber: 1,
    dueDay: Math.floor(index / student.persona.quizzesPerDay),
  }))

  const trajectory: Record<string, number>[] = []
  for (let day = 0; day < opts.days; day += 1) {
    const due = queue.filter((item) => item.dueDay <= day)
    if (due.length > 0) {
      // Cap a day's load; push the spill to tomorrow.
      const capacity = student.persona.quizzesPerDay + 1
      const todays = due.slice(0, capacity)
      for (const spilled of due.slice(capacity)) spilled.dueDay = day + 1
      for (const item of todays) {
        queue.splice(queue.indexOf(item), 1)
        const accuracy = await runAttempt(
          api,
          student,
          item.quiz,
          item.attemptNumber,
          day,
          textureCache,
          llmConfig,
          records,
        )
        // Spaced retake policy: weak quizzes come back soon; strong
        // ones come back once later as a retention probe. A blocked
        // attempt (assignment caps) ends the chain — exactly what a
        // real student would experience.
        if (accuracy !== null && item.attemptNumber < opts.maxAttempts) {
          const retryIn = accuracy < 0.7 ? 2 : 4
          const dueDay = day + retryIn
          if (dueDay < opts.days && (accuracy < 0.7 || item.attemptNumber === 1)) {
            queue.push({
              quiz: item.quiz,
              attemptNumber: item.attemptNumber + 1,
              dueDay,
            })
          }
        }
      }
    }
    trajectory.push({ ...mapMastery(student.learner) })
  }
  trajectories[`${student.persona.key}:${student.studentId}`] = trajectory
}

function mapMastery(learner: VirtualLearner): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [subject, state] of Object.entries(learner.skillSnapshot())) {
    out[subject] = Math.round(state.mastery * 1000) / 1000
  }
  return out
}

// ── Main ───────────────────────────────────────────────────────

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2))
  const api = makeApi(opts.base)

  console.log(`\n🎓 Virtual-student harness against ${opts.base}`)
  console.log(
    `   seed=${opts.seed} days=${opts.days} per-persona=${opts.perPersona} llm-texture=${opts.llm}\n`,
  )

  const [teacherEmail, teacherPassword] = opts.teacher.split(':')
  const teacherToken = await login(api, teacherEmail, teacherPassword)
  let quizzes = await loadContent(api, teacherToken)
  if (opts.subjects) {
    quizzes = quizzes.filter((q) => opts.subjects!.includes(q.subject))
  }
  console.log(`Loaded ${quizzes.length} quizzes via the teacher oracle`)
  if (quizzes.length === 0) {
    throw new Error('no quizzes visible to the teacher account')
  }

  const subjects = [...new Set(quizzes.map((q) => q.subject))]
  const llmConfig = opts.llm ? resolveLlmConfig() : null
  if (opts.llm && !llmConfig) {
    console.warn('LLM texture requested but no provider configured — fallback active')
  }

  const records: AnswerRecord[] = []
  const trajectories: Record<string, Record<string, number>[]> = {}
  // Texture cache is shared across all students of a persona:
  // misconceptions cluster, and it keeps LLM cost flat in --per-persona.
  const textureCache = new Map<string, TextureResult>()

  // Every invocation gets its own accounts: random emails/passwords mean
  // a caller who can reach the API cannot impersonate the synthetic
  // students (or even guess their addresses), and rerunning with the same
  // seed never reuses accounts whose assignment attempt caps are already
  // spent. The seeded RNG still drives every learning decision, so reports
  // reproduce across runs for non-parameterized content. For a completely
  // clean slate, wipe the server's data/ directory instead.
  const runNonce = randomUUID().slice(0, 8)
  for (const persona of PERSONAS) {
    for (let i = 0; i < opts.perPersona; i += 1) {
      const email = `virtual-${persona.key}-${i}-s${opts.seed}-${runNonce}@openpath.dev`
      const password = randomUUID()
      const token = await registerOrLogin(
        api,
        email,
        `Virtual ${persona.key} ${i}`,
        password,
      )
      if (opts.classroomCode) {
        await api.call('/classrooms/join', {
          method: 'POST',
          token,
          body: { code: opts.classroomCode },
        })
      }

      // The student's visible catalog is authoritative — classroom and
      // publication rules apply exactly as they would to a real student.
      const visibleList = await api.call('/quizzes', { token })
      const visibleIds = new Set(
        (visibleList.data.quizzes ?? []).map((q: { id: string }) => q.id),
      )
      const playable = quizzes.filter((q) => visibleIds.has(q.id))

      const me = await api.call('/auth/me', { token })
      const studentId = (me.data.user?.id ?? email) as string

      console.log(
        `▶ ${persona.key} #${i}: ${playable.length}/${quizzes.length} quizzes visible`,
      )
      const student: StudentRun = {
        token,
        studentId,
        persona,
        learner: new VirtualLearner(persona, mulberry32(opts.seed * 1000 + i * 37 + persona.key.length), subjects),
        rng: mulberry32(opts.seed * 777 + i * 13 + persona.key.charCodeAt(0)),
      }
      await simulateStudent(
        api,
        student,
        playable,
        opts,
        textureCache,
        llmConfig,
        records,
        trajectories,
      )
    }
  }

  const { questionStats, quizPersonaStats } = aggregate(records)
  const markdown = renderMarkdown(records, questionStats, quizPersonaStats, {
    seed: opts.seed,
    days: opts.days,
    studentsPerPersona: opts.perPersona,
    llmTexture: Boolean(llmConfig),
  })

  mkdirSync(opts.outDir, { recursive: true })
  const jsonPath = join(opts.outDir, 'virtual-student-report.json')
  const mdPath = join(opts.outDir, 'virtual-student-report.md')
  writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        meta: {
          seed: opts.seed,
          days: opts.days,
          studentsPerPersona: opts.perPersona,
          llmTexture: Boolean(llmConfig),
          generatedAt: new Date().toISOString(),
        },
        records,
        trajectories,
        questionStats,
        quizPersonaStats,
      },
      null,
      2,
    ),
  )
  writeFileSync(mdPath, markdown)

  console.log(`\n✅ ${records.length} graded answers across ${Object.keys(trajectories).length} students`)
  console.log(`   Markdown report: ${mdPath}`)
  console.log(`   Raw data:        ${jsonPath}\n`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
