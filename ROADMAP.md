# OpenPath Roadmap

The path ahead. Items are roughly ordered by impact; nothing here is a promise with a date — this is a community project. Priorities are informed by [`docs/curriculum-research.md`](docs/curriculum-research.md) (evidence base: retrieval practice & spacing are the strongest levers; gamification is a moderate but real amplifier).

## ✅ Shipped (v0.4)

- [x] **Classroom economy** — coins minted from points on homework/classwork/quizzes/tests (kind multipliers, teacher-set currency name/icon/rate), per-level rewards (coins or free items), and a student shop for backgrounds (solid + gradient with direction), leaderboard nameplates (solid, gradient, or teacher-uploaded images), name colours, and fonts — with a full coin ledger
- [x] **Cross-platform everything** — CI matrix (ubuntu/windows/macos) running typecheck, lint, build, and the smoke test on every push; one-line curl installer (plus a PowerShell variant); README install docs covering apt/dnf/pacman/brew/winget/choco/scoop and pnpm/npm/yarn

## ✅ Shipped (v0.3)

- [x] **Assignments** — assign a quiz to a classroom or student with due date, availability window, and max attempts; "due soon" queue on the student dashboard; completion roster for teachers; deadlines double as a spacing mechanism
- [x] **Premade content packs** — registry + first packs: `geometry-figures`, `calculus-i-gateway`, `intro-psych-survey` (tiered by enrollment data; see research doc §6)
- [x] **Import / export** — QTI 2.1 import, CSV export of attempts, full JSON backup/restore (bridge for classrooms living in an LMS)

## ✅ Shipped (v0.2)

- [x] **Spaced repetition** — SM-2-lite scheduling for flashcards; "due today" queue on the student dashboard (research says this is the highest-value learning feature we can add)
- [x] **Figure & equation questions (v1)** — parametric question type: teacher picks a shape template (triangle SAS, right-triangle, circle, trapezoid), enters givens, and the system draws the figure AND computes the answer key, so answers can never be mistyped. Numeric grading with tolerance + auto-generated MCQ distractors. (Prior art: GeoGebra generators, IMathAS; our edge is the editor + gamified loop.)

## 🎯 Next up (v0.5)

- [ ] **Figure questions v2** — parameter ranges so every student gets a randomized variant (the IMathAS trick)
- [ ] **Attempt review mode** — students re-read their answers with explanations after a run

## 🌱 Later (v0.5+)

- [ ] **Figure questions v3** — custom formula mode with a shared formula library; community templates
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
