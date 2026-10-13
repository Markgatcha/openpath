# 🧭 OpenPath

**A local-first, open-source, gamified learning platform for students, teachers, and parents.**

OpenPath turns quizzes, flashcards, and daily practice into an adventure students *want* to go on — while giving teachers a workshop for forging high-quality content and parents a calm window into their child's journey. Everything runs on your own machine: one Node process, one SQLite file, no cloud account required.

```bash
git clone https://github.com/Markgatcha/openpath.git
cd openpath
pnpm install
pnpm dev
# API → http://localhost:8787 · Web → http://localhost:5173
```

> **Demo accounts** (seeded automatically on first boot)
>
> | Role | Email | Password |
> |---|---|---|
> | 🧑‍🏫 Teacher | `ada.lovelace@openpath.dev` | `teach1234` |
> | 🧑‍🎓 Student | `grace.hopper@openpath.dev` | `learn1234` |
> | 🧑‍🎓 Student | `linus.torvalds@openpath.dev` | `learn1234` |
> | 🧑‍👧 Parent | `mary.jackson@openpath.dev` | `parent1234` |
>
> Class join code: `ROOM42` · Student link codes: `OL-GRC01`, `OL-LNX02`

---

## ✨ Why OpenPath?

Great learning content is hard to make, and most platforms lock it — and your students' data — behind someone else's server. OpenPath bets on a different formula:

- **AI as a forge, not a gatekeeper.** Draft questions from a topic with any OpenAI-compatible model (OpenRouter or a local Ollama/llama.cpp). No key? Everything still works.
- **Gamification with taste.** XP, levels, combo multipliers, daily streaks, and badges — motivation engineered in, not bolted on.
- **Three seats at the campfire.** Students play, teachers forge, parents follow along with a link code.
- **Local-first and private.** All data lives in `./data/openpath.db` on your machine. No accounts, no tracking, no telemetry.

## 🎮 Feature tour

### 🧑‍🎓 Students
- **Gamified quiz runs** — instant feedback, combo multipliers, per-question timers, countdown rings, XP pop-ups, and a confetti finish screen
- **Five question types** — multiple choice, true/false, fill-in-the-blank (fuzzy matching), drag-to-rank ordering, and parametric figure questions (the system draws the figure and grades your number with tolerance)
- **Daily goals & streaks** — a study-minutes ring on the dashboard keeps the flame alive
- **Spaced-repetition flashcards** — an SM-2-style "due today" queue built from every quiz you can see; grade yourself honestly and the scheduler handles the rest
- **"Due soon" homework** — assignments with due dates, availability windows, and attempt caps, right on your dashboard
- **Trophy hall & leaderboards** — 8 badges, global and classroom rankings, weekly and all-time windows

### 🧑‍🏫 Teachers
- **Quiz workshop** — create, reorder, and edit questions with a focused builder (auto-saving)
- **Figure question editor** — pick a shape template, type the givens, and the answer key computes itself (never mistyped, always consistent with the drawing)
- **AI question forge** — generate review-ready drafts from a topic, pick the ones you like, insert them
- **Classrooms** — 6-character join codes, member rosters, per-class leaderboards, quiz assignment
- **Assignments** — due dates, availability windows, and attempt caps with per-student completion rosters
- **Content packs** — one click clones ready-made quiz sets (geometry figures, calculus gateway, intro psych) into your library as drafts
- **Import / export** — QTI 2.1 import from your LMS, CSV export of attempts, full JSON backup/restore
- **Analytics** — score distribution, per-question accuracy, toughest questions, and a full attempts table

### 🧑‍👧 Parents & educators
- **Link with a code** — your child shares a code from Settings; you see summaries only, never their answers
- **Progress at a glance** — XP, level, streaks, daily-goal completion, weekly study minutes
- **Insight, not surveillance** — subject strengths, score trends, and "worth another look" weak spots

## 🚀 Quickstart

**Prerequisites:** Node.js ≥ 20.19 and pnpm (`corepack enable`).

```bash
pnpm install        # install dependencies
pnpm dev            # start API (:8787) + web dev server (:5173)
```

Open http://localhost:5173 and log in with a demo account above.

**Production mode:**

```bash
pnpm build          # compiles API → dist/ and web → dist/web
pnpm start          # single server on :8787 serves API + built web app
```

## ⚙️ Configuration

Copy `.env.example` to `.env` and tune as needed:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8787` | API + production web port |
| `JWT_SECRET` | dev value | Signing secret — **change in production** (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
| `DATABASE_PATH` | `./data/openpath.db` | SQLite file location |
| `SEED_DEMO_DATA` | `true` | Seed demo classrooms, quizzes, and accounts on first boot |
| `AI_PROVIDER` | `local` | `openrouter` or `local` |
| `OPENROUTER_API_KEY` | — | Your OpenRouter key |
| `OPENROUTER_MODEL` | `deepseek/deepseek-chat` | Any OpenRouter model slug |
| `LOCAL_AI_BASE_URL` | `http://localhost:11434/v1` | Ollama-compatible endpoint (llama.cpp: `http://localhost:8080/v1`) |
| `LOCAL_AI_MODEL` | `qwen3:8b` | Local model name |

Settings changed in **Settings → AI** inside the app are stored in the database and take precedence over `.env`.

## 🤖 Setting up the AI forge

**Option A — OpenRouter (hosted):** create a key at [openrouter.ai/keys](https://openrouter.ai/keys), then either put it in `.env` or paste it into Settings → AI. Free-tier models rotate; pick whatever suits your classroom budget.

**Option B — Local model (fully offline):**

```bash
# Ollama
ollama pull qwen3:8b
ollama serve                       # serves on :11434

# or llama.cpp
llama-server -m model.gguf --port 8080
```

Then in Settings → AI choose **Local model** with base URL `http://localhost:11434/v1` (or `:8080/v1` for llama.cpp). Teachers can generate question drafts in the quiz builder; students never see AI features.

## 🏗️ Architecture

```
openpath/
├── client/            # React 19 + Vite 8 + Tailwind 4 (SPA)
│   └── src/
│       ├── components/    # UI kit, app shell, gamified widgets
│       ├── lib/           # API client, utils, confetti
│       ├── pages/         # student / teacher / parent / public pages
│       └── store/         # auth store (zustand + persist)
├── server/            # Fastify 5 + better-sqlite3 (CommonJS)
│   ├── routes/        # auth, quizzes, attempts, classrooms, stats, AI,
│   │                  # srs, assignments, packs, import-export
│   ├── lib/           # grading, gamification helpers, DTO mappers
│   └── ai/            # OpenAI-compatible provider layer
├── shared/            # zod schemas + types + pure game math (used by both)
├── scripts/           # end-to-end smoke test
└── data/              # SQLite database (gitignored)
```

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 19, Vite 8, Tailwind 4 | Latest stable, instant HMR, CSS-first theming |
| State | TanStack Query + Zustand | Server cache that stays fresh; tiny auth store |
| Backend | Fastify 5 | Schema-first, fast, first-class TypeScript |
| Database | SQLite (better-sqlite3) | Zero-ops, single file, trivially backed up |
| Validation | Zod (shared) | One schema language end-to-end |
| Type checking | TypeScript 7 (native) | The Go-speed compiler, drop-in `tsc` |
| Linting | oxlint | Rust linter, no TypeScript-API dependency |
| Styling | Tailwind 4 + design tokens | Dark/light themes, consistent UI kit |

**Security notes:** passwords are hashed with bcrypt; sessions are JWTs; students never receive correct answers until they submit; XP and streaks are computed server-side (the client only previews); AI generation is teacher-only and rate-limited.

## 🎲 Gamification rules

XP for a finished run rewards correctness first, then flair:

```
xp = round((correct × 20 × difficultyMultiplier + bestCombo × 5 + timeBonus + perfectBonus)
           × (0.5 + 0.5 × accuracy))
```

- **Difficulty multipliers:** easy ×1, medium ×1.25, hard ×1.5
- **Time bonus:** +15 when you finish in under half the time limit
- **Perfect bonus:** +25 for a 100% run
- **Combo multiplier:** +10% per consecutive correct answer, capped at +100% (preview in the UI)
- **Levels:** `xp(L) = 25 × L × (L − 1)` — level 2 at 50 XP, level 3 at 150, level 4 at 300…
- **Streaks:** complete any quiz on consecutive days to grow your flame

**Badges:** First Steps · Perfectionist · Combo Master · Getting Warm (3-day streak) · Week Warrior (7-day streak) · Speedster (<5s/question at 80%+) · Explorer (3 subjects) · Marathon Runner (10 quizzes)

## 🧪 Testing & quality

```bash
pnpm typecheck     # tsc for server + client
pnpm lint          # oxlint (Rust-fast, no TypeScript compiler dependency)
pnpm build         # production build
pnpm test:api      # end-to-end smoke test (needs a running server)
```

The smoke test exercises the full loop — teacher forges a quiz, student plays it to a perfect score, parent sees the progress — plus auth guards and role enforcement. CI runs typecheck, lint, and build on every push.

## 🐳 Docker

```bash
docker compose up --build    # serves API + web on http://localhost:8787
```

The image builds the client, compiles the server, and persists the SQLite database in a named volume.

## 🔒 Data & privacy

- All student data stays in your local SQLite file
- AI providers see only the topic you type (and only when a teacher uses the forge)
- Nothing phones home; there is no telemetry in this repo

## 🗺️ Roadmap

See [ROADMAP.md](./ROADMAP.md) — highlights: parametric **figure & equation questions** with randomized variants coming, **attempt review mode**, live race mode, a community pack registry, and mastery-gated progression. Priorities follow the evidence in [docs/curriculum-research.md](./docs/curriculum-research.md).

## 🤝 Contributing

Contributions are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md) for the workflow, commit conventions, and the quality gates (`stylua`-level tidiness: typecheck + lint + build must stay green).

## 📄 License

[MIT](./LICENSE) — use it, fork it, teach with it.

---

Built for learners, teachers, and the curious. Go build your own path. 🧭
