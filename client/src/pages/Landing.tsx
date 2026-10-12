import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Award,
  BrainCircuit,
  Cpu,
  Gamepad2,
  LineChart,
  Lock,
  Sparkles,
  Star,
  Users,
  WifiOff,
} from 'lucide-react'
import { Logo } from '@/components/Layout'

const roles = [
  {
    emoji: '🧑‍🎓',
    title: 'Students',
    blurb:
      'Battle quizzes like boss fights — earn XP, keep streaks alive, climb the leaderboard, and collect badges.',
    bullets: ['Timed quiz runs', 'Flashcard training', 'Daily streaks & combos'],
  },
  {
    emoji: '🧑‍🏫',
    title: 'Teachers',
    blurb:
      'Forge quizzes in minutes with four question types, group students into classrooms, and watch the analytics roll in.',
    bullets: ['Drag-and-drop quiz builder', 'AI question drafts', 'Per-question analytics'],
  },
  {
    emoji: '🧑‍👧',
    title: 'Parents & educators',
    blurb:
      'Link with a simple code and see learning come alive — study minutes, streaks, and where your child shines.',
    bullets: ['Weekly progress charts', 'Weak-spot radar', 'Badge trophy case'],
  },
]

const features = [
  {
    icon: <Gamepad2 size={20} />,
    title: 'Gamified to the bone',
    text: 'XP, levels, combo multipliers, streaks, badges, and confetti — motivation engineered in, not bolted on.',
  },
  {
    icon: <BrainCircuit size={20} />,
    title: 'AI question forge',
    text: 'Point OpenRouter or a local model at a topic and get review-ready question drafts. No key? Everything still works.',
  },
  {
    icon: <LineChart size={20} />,
    title: 'Analytics that teach',
    text: 'Per-question accuracy, subject strengths, and study-minute trends turn assessment into insight.',
  },
  {
    icon: <WifiOff size={20} />,
    title: 'Local-first',
    text: 'One Node process, one SQLite file. Your data never leaves the machine unless you send it there.',
  },
  {
    icon: <Lock size={20} />,
    title: 'Private by design',
    text: 'No accounts in the cloud, no tracking pixels. Self-host it on a laptop, a Pi, or a school server.',
  },
  {
    icon: <Cpu size={20} />,
    title: 'Bring your own brain',
    text: 'Any OpenAI-compatible endpoint: OpenRouter, Ollama, llama.cpp. Swap providers in Settings.',
  },
]

export function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-ink-950">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0" aria-hidden>
        <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-brand-400/25 blur-3xl animate-float-slow dark:bg-brand-600/25" />
        <div className="absolute -right-32 top-1/3 h-[24rem] w-[24rem] rounded-full bg-violet-400/20 blur-3xl animate-float dark:bg-violet-600/20" />
        <div className="absolute bottom-0 left-1/3 h-[20rem] w-[20rem] rounded-full bg-cyan-400/15 blur-3xl animate-float-slow dark:bg-cyan-600/10" />
      </div>

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="flex items-center gap-2">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="btn-ghost hidden sm:inline-flex"
          >
            <Star size={16} />
            Star on GitHub
          </a>
          <Link to="/login" className="btn-ghost">
            Log in
          </Link>
          <Link to="/register" className="btn-primary">
            Start free
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-12 text-center sm:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-1.5 text-xs font-semibold text-slate-600 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
        >
          <Sparkles size={13} className="text-gold-500" />
          100% open source · runs entirely on your machine
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="mx-auto mt-6 max-w-3xl font-display text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-6xl dark:text-white"
        >
          Learning that feels like{' '}
          <span className="text-gradient">an adventure</span>, not homework.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.12 }}
          className="mx-auto mt-6 max-w-2xl text-base text-slate-600 sm:text-lg dark:text-slate-400"
        >
          OpenPath turns quizzes, flashcards, and practice into a game students
          actually want to play — while teachers get a workshop that forges
          quality content and parents get a window into the journey. All local.
          All yours.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link to="/register" className="btn-primary px-6 py-3 text-base">
            Create your account
            <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="btn-ghost px-6 py-3 text-base">
            Explore the demo
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-4 font-mono text-xs text-slate-400 dark:text-slate-500"
        >
          git clone · pnpm install · pnpm dev — that's the whole setup
        </motion.p>
      </section>

      {/* Roles */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-5 md:grid-cols-3">
          {roles.map((role, index) => (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: index * 0.1 }}
              className="card card-hover flex flex-col gap-4 p-6"
            >
              <span className="text-4xl">{role.emoji}</span>
              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                {role.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {role.blurb}
              </p>
              <ul className="mt-auto flex flex-col gap-1.5">
                {role.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
        <h2 className="mb-8 text-center font-display text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
          Everything the quest needs
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              className="card p-5"
            >
              <span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-brand-500/10 text-brand-500 dark:text-brand-400">
                {feature.icon}
              </span>
              <h3 className="mb-1.5 font-display text-base font-bold text-slate-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {feature.text}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Terminal mock */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 pb-20">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-2xl dark:border-white/10">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-rose-500" />
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            <span className="ml-2 font-mono text-xs text-slate-400">
              openpath — bash
            </span>
          </div>
          <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-slate-300">
            <code>
              <span className="text-emerald-400">$</span> pnpm install && pnpm dev{'\n'}
              <span className="text-slate-500"># api  → http://localhost:8787</span>{'\n'}
              <span className="text-slate-500"># web  → http://localhost:5173</span>{'\n'}
              <span className="text-slate-500"># db   → ./data/openpath.db (SQLite)</span>
              {'\n\n'}
              <span className="text-violet-400">🌱 Seeded demo data:</span>{'\n'}
              <span className="text-slate-500">   teacher → ada.lovelace@openpath.dev</span>{'\n'}
              <span className="text-slate-500">   student → grace.hopper@openpath.dev</span>{'\n'}
              <span className="text-slate-500">   parent  → mary.jackson@openpath.dev</span>{'\n'}
              <span className="text-emerald-400">$</span> _
            </code>
          </pre>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 py-8 dark:border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <Logo />
          <p className="text-xs text-slate-500 dark:text-slate-500">
            MIT licensed · Built for learners, teachers, and the curious
          </p>
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Users size={13} /> 3 roles
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Award size={13} /> 8 badges
            </span>
            <span className="inline-flex items-center gap-1.5">
              <WifiOff size={13} /> offline-ready
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
