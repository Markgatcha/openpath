# OpenPath Roadmap

The path ahead. Items are roughly ordered by impact; nothing here is a promise with a date — this is a community project. Priorities are informed by [`docs/curriculum-research.md`](docs/curriculum-research.md) (what to teach) and the Oct 2026 feature & distribution research pass (evidence × market: spacing, feedback content, mastery learning, AI tutoring, competitor scan).

## ✅ Shipped on main (unreleased)

- [x] **Desktop app** — Tauri 2 window around the same Fastify server (bundled as a renamed Node sidecar, not a rewrite); a `v*` tag triggers a 3-OS release workflow that builds deb/AppImage/dmg/NSIS installers into a draft GitHub Release — details in [`src-tauri/README.md`](src-tauri/README.md)
- [x] **Work-completion notifications** — finishing a homework or classwork quiz notifies the quiz's teacher and every linked parent; in-app bell (unread count polled every 30s) plus a feed at `/notifications` with mark-read / read-all. Deliberately local-first: no push server, no email
- [x] **AI kill switch** — Settings → AI gains a master on/off for every AI surface; it persists instantly (no Save button), is teacher-only, and the server answers 403 while it's off
- [x] **Dependency drift detection** — `pnpm check-updates` locally plus a weekly scheduled sweep (`version-check.yml`) that opens a tracking issue when Node, pnpm, or any dependency lags; Node pinned at 26 (CI, `engines`, desktop sidecar)

## ✅ Shipped (v0.5)

- [x] **Spaced repetition v2 (FSRS + interleaving)** — the [TS-FSRS](https://github.com/open-spaced-repetition/ts-fsrs) memory model (Anki made FSRS the default in v24.11): per-card stability + difficulty replace SM-2-lite, with a backfill migration from legacy rows; the due queue round-robins across decks (quiz ids) so same-topic cards don't clump — blocking true vocabulary decks awaits per-deck category metadata
- [x] **Figure questions v2** — per-given parameter ranges so every attempt samples fresh numbers (seeded per question + attempt, validated by rejection sampling, teacher prototype as the guaranteed-solvable fallback); grading, the answer reveal, and the review breakdown all use the exact numbers the student saw
- [x] **Attempt review mode** — students re-read their answers after a run: per-question diffs (your answer vs the key), tolerance notes, worked explanations, and figures redrawn exactly as shown. Reachable from results, the student dashboard, and the teacher analytics table. Elaborated feedback has the best evidence-per-line-of-code of anything on this roadmap
- [x] **Confidence + accuracy capture** — students tag each answer *before* the reveal ("did you *know* it or guess it?"); "knew it vs. guessed it" calibration views land on the results/review screens and a per-quiz analytics card for teachers, flagging lucky guesses and overconfident misses
- [x] **Live race mode** — Kahoot-style synchronous class play over LAN WebSockets: ephemeral in-memory rooms (a 6-character code, no coins/XP/attempts — a motivation top-up), per-race figure variants so everyone solves the same numbers, live answering with speed + streak bonuses, auto-reveal when the whole room is in, and a host console that paces the event. Socket frames restore the exact screen on reconnect; the graded pipeline stays untouched

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

## 🌱 Next up (v0.6)

- [ ] **Accessibility & accommodations** — read-aloud (TTS), dyslexia-friendly font, one-click translation, per-student difficulty adjust (DOJ Title II WCAG 2.1 AA deadlines: Apr 2026 / Apr 2027 — schools will ask), on top of the original full-keyboard-play / screen-reader / reduced-motion pass
- [ ] **Question Forge 2.0** — ingest PDF/URL/text → generate draft questions of all types → teacher review queue before publication (table-stakes AI generation is commoditizing, and local-first competitors just entered this lane)
- [ ] **Socratic mistake coach** — an "Explain My Mistake" button inside the wrong-answer flow (student attempts first, AI explains after; never a standalone chat tab), respecting the teacher `Settings -> AI` kill switch
- [ ] **Class insights for teachers** — "your class struggles with X" aggregates across quizzes
- [ ] **PWA offline shell + LAN sync** — practice survives flaky classroom Wi-Fi, plus teacher-to-student bundle sync (pull assignments / push attempts) through a small changes-since-timestamp endpoint on the existing SQLite file — deliberately not PowerSync/ElectricSQL (they demand Postgres) or CR-SQLite (unmaintained)
- [ ] **Mastery-gate mode** — proficiency-based progression (demonstrate mastery to advance) with a corrective loop + spaced review; market it honestly — field-scale effects are modest, not 2σ, and research shows the *loop* matters far more than the threshold
- [ ] **Question bank** — reusable questions shared across a teacher's quizzes
- [ ] **Figure questions v3** — custom formula mode with a shared formula library; community templates
- [ ] **Themes** — student-selectable accent colors and celebratory effects
- [ ] **i18n** — extract UI strings; start with English + 简体中文

## 🔭 Ideas on the horizon

- [ ] **LTI 1.3 launch + AGS grade passback** — the institutional distribution channel: OpenPath becomes an installable tool inside Canvas/Moodle/Blackboard/D2L via a public-HTTPS "server mode" of the existing backend; the local-first SPA stays untouched
- [ ] **In-round power-ups** — spend classroom coins mid-run (streak shield, 2×, hint); the Gimkit pattern — motivation-only per the evidence, so keep it small
- [ ] **Plugin API** — let the community add mini-games (e.g. a "match the pairs" mode) as question renderers
- [ ] **Peer quiz mode** — students author quizzes for each other with teacher moderation (KitCollab-style submission)
- [ ] **Community pack registry** — teachers publish/share question packs under CC-BY; export QTI 3.0 when the registry needs it (2.1 stays the import format)
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
