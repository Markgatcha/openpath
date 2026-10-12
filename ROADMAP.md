# OpenPath Roadmap

The path ahead. Items are roughly ordered by impact; nothing here is a promise with a date — this is a community project.

## 🎯 Next up (v0.2)

- [ ] **Spaced repetition** — schedule flashcard reviews with an SM-2-lite algorithm; surface "due today" on the student dashboard
- [ ] **Import / export** — QTI 2.1 import, CSV export of attempts, and full JSON backup/restore of a classroom
- [ ] **Assignments** — assign a quiz to a classroom with a due date; student dashboard shows deadlines
- [ ] **More question types** — multi-select ("choose all that apply"), numeric range, and short-essay (teacher-graded)
- [ ] **Parent weekly email digest** — opt-in local summary rendered to a printable page

## 🌱 Later (v0.3+)

- [ ] **Attempt review mode** — students re-read their answers with explanations after a run
- [ ] **Class insights for teachers** — "your class struggles with X" aggregates across quizzes
- [ ] **Question bank** — reusable questions shared across a teacher's quizzes
- [ ] **Themes** — student-selectable accent colors and celebratory effects
- [ ] **i18n** — extract UI strings; start with English + 简体中文
- [ ] **Accessibility pass** — full keyboard play, screen-reader labels for all question types, reduced-motion respect
- [ ] **PWA** — offline shell so practice survives flaky classroom Wi-Fi

## 🔭 Ideas on the horizon

- [ ] **Plugin API** — let the community add mini-games (e.g. a "match the pairs" mode) as question renderers
- [ ] **Peer quiz mode** — students author quizzes for each other with teacher review
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
