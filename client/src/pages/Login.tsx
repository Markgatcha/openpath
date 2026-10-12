import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Compass, Eye, EyeOff } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { Button, Field, Input } from '@/components/ui'
import { Logo } from '@/components/Layout'

export function Login() {
  const navigate = useNavigate()
  const { setAuth } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await api.login({ email, password })
      setAuth(result.token, result.user)
      navigate(
        result.user.role === 'student'
          ? '/student'
          : result.user.role === 'teacher'
            ? '/teacher'
            : '/parent',
        { replace: true },
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = () => {
    setEmail('grace.hopper@openpath.dev')
    setPassword('learn1234')
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-50 px-4 dark:bg-ink-950">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl animate-float-slow" />
      <div className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl animate-float" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="card p-7">
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Welcome back, adventurer
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Log in to continue your quest.
          </p>

          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
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

            <Field label="Password">
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
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
              Log in
            </Button>
          </form>

          <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 text-center text-sm dark:border-white/10">
            <button
              type="button"
              onClick={fillDemo}
              className="mx-auto inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
            >
              <Compass size={13} />
              Use demo student credentials
            </button>
            <p className="text-slate-500 dark:text-slate-400">
              New here?{' '}
              <Link
                to="/register"
                className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
