/**
 * Difficulty-report builder for the virtual-student harness.
 *
 * Consumes every graded answer the virtual students produced and emits:
 * - a machine-readable JSON dump (all raw records + aggregates)
 * - a Markdown report: per-quiz learning curves, hardest questions,
 *   distractor analysis, confidence calibration, and content flags.
 */

export interface AnswerRecord {
  studentId: string
  persona: string
  quizId: string
  quizTitle: string
  subject: string
  difficulty: string
  questionId: string
  prompt: string
  type: string
  /** Which pass over this quiz (1 = first time the student saw it). */
  attemptNumber: number
  day: number
  correct: boolean
  msTaken: number
  confidence: string | null
  /** Model internals, for the learning-curve view. */
  effectiveMastery: number
  masteryAfter: number
  readExplanation: boolean
  /** Compact response summary (index/text), for distractor analysis. */
  responseSummary: string
  correctSummary: string
}

export interface QuestionStat {
  questionId: string
  prompt: string
  quizTitle: string
  subject: string
  difficulty: string
  type: string
  firstErrorRate: number
  finalErrorRate: number
  avgMs: number
  /** Share of wrong answers self-rated fairly-sure/certain. */
  confidentWrongShare: number
  distractors: Record<string, number>
  flags: string[]
}

export interface QuizPersonaStat {
  quizTitle: string
  subject: string
  difficulty: string
  persona: string
  firstAccuracy: number
  finalAccuracy: number
  attempts: number
  /** Students present in both the first and final attempts. */
  pairedStudents: number
  /** Accuracy drop between best early attempt and spaced retake. */
  forgettingDrop: number
  avgMs: number
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0
}

export function aggregate(records: AnswerRecord[]): {
  questionStats: QuestionStat[]
  quizPersonaStats: QuizPersonaStat[]
} {
  // ── Per question ────────────────────────────────────────────
  const byQuestion = new Map<string, AnswerRecord[]>()
  for (const r of records) {
    const list = byQuestion.get(r.questionId)
    if (list) list.push(r)
    else byQuestion.set(r.questionId, [r])
  }

  const questionStats: QuestionStat[] = []
  for (const [questionId, rs] of byQuestion) {
    const firsts = rs.filter((r) => r.attemptNumber === 1)
    const maxAttempt = Math.max(...rs.map((r) => r.attemptNumber))
    const finals = rs.filter((r) => r.attemptNumber === maxAttempt)
    const wrong = rs.filter((r) => !r.correct)
    const confidentWrong = wrong.filter(
      (r) => r.confidence === 'fairly-sure' || r.confidence === 'certain',
    )

    const distractors: Record<string, number> = {}
    for (const r of wrong) {
      distractors[r.responseSummary] = (distractors[r.responseSummary] ?? 0) + 1
    }

    const firstErrorRate = 1 - mean(firsts.map((r) => (r.correct ? 1 : 0)))
    const finalErrorRate = 1 - mean(finals.map((r) => (r.correct ? 1 : 0)))
    const confidentWrongShare = wrong.length
      ? confidentWrong.length / wrong.length
      : 0

    const flags: string[] = []
    // Learnability claims need retake evidence: with no second attempt,
    // "final" is just the first attempt re-read.
    if (maxAttempt >= 2 && firstErrorRate >= 0.4 && finalErrorRate >= 0.4) {
      flags.push('stuck — students miss it even after feedback; explanation may not be landing')
    } else if (maxAttempt >= 2 && firstErrorRate >= 0.4 && finalErrorRate < 0.25) {
      flags.push('challenging but learnable — exactly where good content sits')
    } else if (firstErrorRate < 0.1) {
      flags.push('too easy — little learning value')
    }
    if (confidentWrongShare >= 0.5 && wrong.length >= 5) {
      flags.push('confidence trap — students are sure they know it and are wrong')
    }

    const sample = rs[0]
    questionStats.push({
      questionId,
      prompt: sample.prompt,
      quizTitle: sample.quizTitle,
      subject: sample.subject,
      difficulty: sample.difficulty,
      type: sample.type,
      firstErrorRate,
      finalErrorRate,
      avgMs: mean(rs.map((r) => r.msTaken)),
      confidentWrongShare,
      distractors,
      flags,
    })
  }

  // ── Per quiz × persona ──────────────────────────────────────
  const byQuizPersona = new Map<string, AnswerRecord[]>()
  for (const r of records) {
    const key = `${r.quizId}::${r.persona}`
    const list = byQuizPersona.get(key)
    if (list) list.push(r)
    else byQuizPersona.set(key, [r])
  }

  const quizPersonaStats: QuizPersonaStat[] = []
  for (const [, rs] of byQuizPersona) {
    // Which students sat which attempt number.
    const attemptsByStudent = new Map<string, Map<number, AnswerRecord[]>>()
    for (const r of rs) {
      let perStudent = attemptsByStudent.get(r.studentId)
      if (!perStudent) {
        perStudent = new Map()
        attemptsByStudent.set(r.studentId, perStudent)
      }
      const list = perStudent.get(r.attemptNumber)
      if (list) list.push(r)
      else perStudent.set(r.attemptNumber, [r])
    }
    const attempts = [
      ...new Set(rs.map((r) => r.attemptNumber)),
    ].sort((a, b) => a - b)
    const first = attempts[0]
    const last = attempts[attempts.length - 1]

    // Paired cohort: only students present at BOTH ends count toward
    // first-vs-final, otherwise the comparison measures dropout (weaker
    // students retake more) instead of learning.
    const paired = [...attemptsByStudent.values()].filter(
      (perStudent) => perStudent.has(first) && perStudent.has(last),
    )
    const cohort = attempts.length > 1 ? paired : [...attemptsByStudent.values()]
    const accuracyOf = (n: number) =>
      mean(
        cohort.flatMap((perStudent) =>
          (perStudent.get(n) ?? []).map((r) => (r.correct ? 1 : 0)),
        ),
      )

    const firstAccuracy = accuracyOf(first)
    const finalAccuracy = accuracyOf(last)
    const bestEarly =
      attempts.length > 1
        ? Math.max(...attempts.slice(0, -1).map(accuracyOf))
        : firstAccuracy
    const forgettingDrop =
      attempts.length > 1 ? Math.max(0, bestEarly - finalAccuracy) : 0

    const sample = rs[0]
    quizPersonaStats.push({
      quizTitle: sample.quizTitle,
      subject: sample.subject,
      difficulty: sample.difficulty,
      persona: sample.persona,
      firstAccuracy,
      finalAccuracy,
      attempts: attempts.length,
      pairedStudents: cohort.length,
      forgettingDrop,
      avgMs: mean(rs.map((r) => r.msTaken)),
    })
  }

  return { questionStats, quizPersonaStats }
}

function pct(x: number): string {
  return `${Math.round(x * 100)}%`
}

/** One-line, table-safe question label. */
function shortPrompt(prompt: string): string {
  const flat = prompt.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()
  return flat.length > 70 ? `${flat.slice(0, 67)}…` : flat
}

export function renderMarkdown(
  records: AnswerRecord[],
  questionStats: QuestionStat[],
  quizPersonaStats: QuizPersonaStat[],
  meta: { seed: number; days: number; studentsPerPersona: number; llmTexture: boolean },
): string {
  const students = new Set(records.map((r) => r.studentId)).size
  const quizzes = new Set(records.map((r) => r.quizId)).size
  const overallAccuracy = mean(records.map((r) => (r.correct ? 1 : 0)))

  const lines: string[] = []
  lines.push('# Virtual Student Difficulty Report')
  lines.push('')
  lines.push(
    `${students} virtual students (${meta.studentsPerPersona} per persona) worked through ` +
      `${quizzes} quizzes over ${meta.days} simulated days (seed ${meta.seed}). ` +
      `${records.length} answers graded, overall accuracy ${pct(overallAccuracy)}.`,
  )
  lines.push('')
  lines.push(
    'Answer correctness is sampled from a learner model calibrated to real student data ' +
      '(BKT knowledge tracing fit on ASSISTments; forgetting curves in the FSRS family; ' +
      'EdNet-scale response-time distributions). Wrong-answer texture is ' +
      (meta.llmTexture
        ? 'LLM-generated (plausible misconception-driven distractors).'
        : 'uniform statistical picks (no LLM key configured).'),
  )
  lines.push('')

  // ── Quiz table ───────────────────────────────────────────────
  lines.push('## Per-quiz learning curves')
  lines.push('')
  lines.push('| Quiz | Subject | Difficulty | Persona | First attempt | Final attempt | Forgetting drop | Avg time/question |')
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |')
  const sorted = [...quizPersonaStats].sort((a, b) =>
    `${a.quizTitle}${a.persona}`.localeCompare(`${b.quizTitle}${b.persona}`),
  )
  for (const s of sorted) {
    lines.push(
      `| ${s.quizTitle} | ${s.subject} | ${s.difficulty} | ${s.persona} | ` +
        `${pct(s.firstAccuracy)} | ${pct(s.finalAccuracy)} (n=${s.pairedStudents}) | ${pct(s.forgettingDrop)} | ` +
        `${(s.avgMs / 1000).toFixed(1)}s |`,
    )
  }
  lines.push('')
  lines.push(
    '_First/final accuracies use the paired cohort — students who sat both ' +
      'the first and the final attempt — so the comparison measures learning, ' +
      'not dropout._',
  )
  lines.push('')

  // ── Hardest questions ────────────────────────────────────────
  lines.push('## Hardest questions (by first-attempt error rate)')
  lines.push('')
  lines.push('| Question | Quiz | Type | First error | Final error | Confident-wrong | Flags |')
  lines.push('| --- | --- | --- | --- | --- | --- | --- |')
  const hardest = [...questionStats]
    .sort((a, b) => b.firstErrorRate - a.firstErrorRate)
    .slice(0, 25)
  for (const q of hardest) {
    lines.push(
      `| ${shortPrompt(q.prompt)} | ${q.quizTitle} | ${q.type} | ` +
        `${pct(q.firstErrorRate)} | ${pct(q.finalErrorRate)} | ` +
        `${pct(q.confidentWrongShare)} | ${q.flags.join('; ') || '—'} |`,
    )
  }
  lines.push('')

  // ── Stuck content ────────────────────────────────────────────
  const stuck = questionStats.filter((q) =>
    q.flags.some((f) => f.startsWith('stuck')),
  )
  lines.push('## Content that is not landing')
  lines.push('')
  if (stuck.length === 0) {
    lines.push('No questions stayed unlearnable after feedback — nothing is stuck.')
  } else {
    lines.push(
      'These questions keep error rates high even after students read the ' +
        'explanations and retry. They are the first place to improve wording, ' +
        'explanations, or prerequisites:',
    )
    lines.push('')
    for (const q of stuck) {
      lines.push(
        `- **${q.quizTitle}** — "${shortPrompt(q.prompt)}" (${q.type}) — ` +
          `first error ${pct(q.firstErrorRate)}, still ${pct(q.finalErrorRate)} on final attempts`,
      )
    }
  }
  lines.push('')

  // ── Distractor analysis ──────────────────────────────────────
  lines.push('## Distractor analysis (MCQ)')
  lines.push('')
  const mcqs = questionStats.filter(
    (q) => q.type === 'mcq' && Object.keys(q.distractors).length > 0,
  )
  if (mcqs.length === 0) {
    lines.push('No MCQ errors recorded.')
  } else {
    lines.push('| Quiz | Question | Wrong options chosen (count) |')
    lines.push('| --- | --- | --- |')
    for (const q of mcqs.slice(0, 20)) {
      const dist = Object.entries(q.distractors)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => `${k} (${v})`)
        .join(', ')
      lines.push(`| ${q.quizTitle} | ${shortPrompt(q.prompt)} | ${dist} |`)
    }
    if (!meta.llmTexture) {
      lines.push('')
      lines.push(
        '_Uniform fallback picks — configure OPENROUTER_API_KEY or LOCAL_AI_BASE_URL ' +
          'for misconception-driven distractor texture._',
      )
    }
  }
  lines.push('')

  lines.push('## Methodology notes')
  lines.push('')
  lines.push(
    '- Mastery is per quiz subject (OpenPath questions carry no skill tags); ' +
      'each persona additionally has seeded subject affinities.',
  )
  lines.push(
    '- Forgetting applies between simulated days: retrievability decays ' +
      'exponentially with each persona’s memory stability, which grows on ' +
      'successful retrieval and shrinks on lapses.',
  )
  lines.push(
    '- Learning happens on feedback: both correct answers and ' +
      'explanation-reading after a miss raise mastery with diminishing returns.',
  )
  lines.push(
    '- Everything is driven by a seeded RNG, so a run with the same seed and ' +
      'content reproduces exactly (LLM texture aside).',
  )
  lines.push('')

  return lines.join('\n')
}
