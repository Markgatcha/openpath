import { Link } from 'react-router-dom'
import { Logo } from '@/components/Layout'

export function NotFound() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-50 px-4 dark:bg-ink-950">
      <div className="pointer-events-none absolute left-1/4 top-10 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl animate-float-slow" />
      <div className="relative z-10 flex flex-col items-center gap-5 text-center">
        <Logo />
        <span className="font-display text-7xl font-extrabold text-gradient">
          404
        </span>
        <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">
          This trail leads nowhere
        </h1>
        <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
          The page you’re looking for has wandered off the path. Let’s get you
          back to camp.
        </p>
        <Link to="/" className="btn-primary">
          Back to base camp
        </Link>
      </div>
    </div>
  )
}
