import { Suspense, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Box, ChevronLeft, Gamepad2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LAB_MODELS, dailyLabModel, findLabModel } from '@/components/models/catalog'
import { findPack } from '@shared/packs'

/** Placeholder with the viewer's footprint while three.js streams in. */
export function ModelSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]" role="status" aria-label="Loading 3D model">
      <div className="grid h-[58vh] min-h-[360px] place-items-center rounded-2xl border border-slate-200 bg-gradient-to-b from-ink-800 to-ink-950 dark:border-white/10">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Box size={32} className="animate-pulse motion-reduce:animate-none" />
          <span className="text-sm">Building procedural 3D geometry…</span>
        </div>
      </div>
      <div className="card flex flex-col gap-4 p-5">
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="h-8 animate-pulse rounded-lg bg-slate-200 motion-reduce:animate-none dark:bg-white/10" />
        ))}
      </div>
    </div>
  )
}

export function ModelLab() {
  const { modelId } = useParams()
  const navigate = useNavigate()
  const [subjectFilter, setSubjectFilter] = useState<string>('All')
  const daily = dailyLabModel()
  const model = findLabModel(modelId) ?? null

  const subjects = ['All', ...Array.from(new Set(LAB_MODELS.map((m) => m.subject)))]

  if (!model) {
    const visibleModels =
      subjectFilter === 'All'
        ? LAB_MODELS
        : LAB_MODELS.filter((m) => m.subject === subjectFilter)

    return (
      <div className="flex flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold text-slate-900 dark:text-white">
              <Box className="text-cyan-500" /> Procedural 3D Model Lab ({LAB_MODELS.length})
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {LAB_MODELS.length} zero-asset 2D &amp; 3D mathematical and scientific simulations —
              built from interactive Canvas/SVG and Three.js geometry in your browser, 100% offline.
            </p>
          </div>
          <Link to="/student/arcade" className="btn-ghost">
            <Gamepad2 size={16} /> Open Educational Arcade
          </Link>
        </header>

        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter models by subject">
          {subjects.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSubjectFilter(sub)}
              className={cn(
                'chip transition',
                subjectFilter === sub
                  ? 'bg-brand-500 text-white'
                  : 'bg-slate-500/10 text-slate-600 hover:bg-slate-500/20 dark:text-slate-300',
              )}
            >
              {sub}
            </button>
          ))}
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleModels.map((item) => {
            const pack = findPack(item.packId)
            return (
              <li key={item.id}>
                <Link
                  to={`/student/lab/${item.id}`}
                  className={cn(
                    'card card-hover flex h-full flex-col gap-3 p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                    item.id === daily.id && 'border-cyan-400/60',
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-4xl" aria-hidden>
                      {item.icon}
                    </span>
                    {item.id === daily.id && (
                      <span className="chip bg-cyan-500/15 text-cyan-700 dark:text-cyan-300">
                        <Sparkles size={12} /> Today’s lab
                      </span>
                    )}
                  </div>
                  <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{item.blurb}</p>
                  <div className="mt-auto pt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <div>
                      {item.subject} · {item.standards}
                    </div>
                    {pack && (
                      <div className="mt-1 text-[11px] text-brand-600 dark:text-brand-300">
                        Pack: {pack.name}
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  const { Component } = model
  const companionPack = findPack(model.packId)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => navigate('/student/lab')} className="btn-ghost">
          <ChevronLeft size={15} /> All {LAB_MODELS.length} models
        </button>
        <nav aria-label="Switch model" className="flex flex-wrap gap-1.5">
          {LAB_MODELS.map((item) => (
            <Link
              key={item.id}
              to={`/student/lab/${item.id}`}
              aria-current={item.id === model.id ? 'page' : undefined}
              className={cn(
                'chip',
                item.id === model.id
                  ? 'bg-brand-500/20 text-brand-700 dark:text-brand-200'
                  : 'bg-slate-500/10 text-slate-600 hover:bg-slate-500/20 dark:text-slate-300',
              )}
            >
              <span aria-hidden>{item.icon}</span> {item.title}
            </Link>
          ))}
        </nav>
      </div>
      <Suspense fallback={<ModelSkeleton />}>
        {/* key: switching models fully unmounts the old WebGL context. */}
        <Component key={model.id} />
      </Suspense>
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4 text-xs text-slate-600 dark:text-slate-300">
        <div>
          <span className="font-bold text-slate-900 dark:text-white">{model.standards}</span>
          {companionPack && (
            <span>
              {' '}
              · Companion Curriculum Pack: <strong>{companionPack.name}</strong>
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/student/arcade/match?pack=${model.packId}`}
            className="chip bg-brand-500/15 text-brand-700 hover:bg-brand-500/25 dark:text-brand-200"
          >
            Play Speed Match →
          </Link>
          <Link
            to="/student/arcade/siege"
            className="chip bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-200"
          >
            Streak Siege →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ModelLab
