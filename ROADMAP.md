# OpenPath Roadmap

The path ahead. Items are roughly ordered by impact; nothing here is a promise with a date — this is a community project. Priorities are informed by [`docs/curriculum-research.md`](docs/curriculum-research.md) (evidence base: retrieval practice & spacing are the strongest levers; gamification is a moderate but real amplifier).

## 🎯 Next up (v0.2)

- [ ] **Spaced repetition** — SM-2-lite scheduling for flashcards; "due today" queue on the student dashboard (research says this is the highest-value learning feature we can add)
- [ ] **Figure & equation questions (v1)** — parametric question type: teacher picks a shape template (triangle SAS, right-triangle, circle, trapezoid), enters givens, and the system draws the figure AND computes the answer key, so answers can never be mistyped. Numeric grading with tolerance + auto-generated MCQ distractors. (Prior art: GeoGebra generators, IMathAS; our edge is the editor + gamified loop.)
- [ ] **Assignments** — assign a quiz/pack to a classroom or student with due date, time window, and max attempts; "Due soon" queue; completion roster for teachers; deadlines double as a spacing mechanism
- [ ] **Premade content packs** — registry + first packs: `geometry-figures`, `calculus-i-gateway`, `intro-psych-survey` (tiered by enrollment data; see research doc §6)
- [ ] **Import / export** — QTI 2.1 import, CSV export of attempts, full JSON backup/restore (bridge for classrooms living in an LMS)

## 🌱 Later (v0.3+)

- [ ] **Figure questions v2** — parameter ranges so every student gets a randomized variant (the IMathAS trick)
- [ ] **Figure questions v3** — custom formula mode with a shared formula library; community templates
- [ ] **Attempt review mode** — students re-read their answers with explanations after a run
- [ ] **Live race mode** — Kahoot-style synchronous class play for engagement top-ups
- [ ] **Class insights for teachers** — "your class struggles with X" aggregates across quizzes
- [ ] **Question bank** — reusable questions shared across a teacher's quizzes
- [ ] **Themes** — student-selectable accent colors and celebratory effects
- [ ] **Mastery-gate mode** — proficiency-based progression (demonstrate mastery to advance)
- [ ] **i18n** — extract UI strings; start with English + 简体中文
- [ ] **Accessibility pass** — full keyboard play, screen-reader labels for all question types, reduced-motion respect
- [ ] **PWA** — offline shell so practice survives flaky classroom Wi-Fi

## 🔭 Ideas on the horizon

- [ ] **Plugin API** — let the community add mini-games (e.g. a "match the pairs" mode) as question renderers
- [ ] **Peer quiz mode** — students author quizzes for each other with teacher review
- [ ] **Community pack registry** — teachers publish/share question packs under CC-BY
- [ ] **Local LLD tournaments** — seasonal classroom events driven by the leaderboard

## ✅ Shipped (v0.1)

- [x] Three roles: student, teacher, parent — with JWT auth and bcrypt
- [x] Quiz builder with 4 question types, reordering, publish/duplicate
- [x] Gamified player: instant feedback, combos, timers, XP, confetti
- [x] XP/levels/streaks/badges computed server-side
- [x] Global + classroom leaderboards (weekly / all-time)
- [x] Teacher analytics: score distribution, per-question accuracy, attempts table
- [x] Parent dashboard: linked children, trends, weak spots, badges
- [x] AI question forge via OpenRouter or any OpenAI-compatible local endpoint
- [x] Flashcard drills built from quiz content
- [x] SQLite persistence with migrations, seeded demo data
- [x] Docker image + compose, CI (typecheck/lint/build), MIT license
