import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { Button, Field, Input } from '@/components/ui'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/Layout'
import type { Role } from '@shared/schemas'

const roleOptions: {
  role: Role
  emoji: string
  title: string
  blurb: string
}[] = [
  {
    role: 'student',
    emoji: '🧑‍🎓',
    title: 'Student',
    blurb: 'Play quizzes, earn XP, keep streaks',
  },
  {
    role: 'teacher',
    emoji: '🧑‍🏫',
    title: 'Teacher',
    blurb: 'Forge quizzes and track progress',
  },
  {
    role: 'parent',
    emoji: '🧑‍👧',
    title: 'Parent / Educator',
    blurb: 'Follow your child’s journey',
  },
]

export function Register() {
  const navigate = useNavigate()
  const { setAuth } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('student')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await api.register({ name, email, password, role })
      setAuth(result.token, result.user)
      void navigate(
        result.user.role === 'student'
          ? '/student'
          : result.user.role === 'teacher'
            ? '/teacher'
            : '/parent',
        { replace: true },
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-50 px-4 py-10 dark:bg-ink-950">
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl animate-float-slow" />
      <div className="pointer-events-none absolute -bottom-32 left-0 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl animate-float" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="card p-7">
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Begin your journey
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Everything stays on this machine. Pick your path:
          </p>

          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
            <div className="grid gap-2.5 sm:grid-cols-3">
              {roleOptions.map((option) => (
                <button
                  key={option.role}
                  type="button"
                  onClick={() => setRole(option.role)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl border p-3.5 text-center transition',
                    role === option.role
                      ? 'border-brand-500 bg-brand-500/10 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20',
                  )}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {option.title}
                  </span>
                  <span className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">
                    {option.blurb}
                  </span>
                </button>
              ))}
            </div>

            <Field label="Display name">
              <Input
                required
                minLength={2}
                placeholder="Grace Hopper"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>

            <Field label="Email">
              <Input
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>

            <Field label="Password" hint="At least 8 characters">
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            {error && (
              <p className="rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-300">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} className="mt-1 w-full">
              Create account
            </Button>
          </form>

          <p className="mt-5 border-t border-slate-200 pt-5 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
            >
              Log in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
