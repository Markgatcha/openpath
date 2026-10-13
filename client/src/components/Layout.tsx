import { useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Award,
  CalendarClock,
  ClipboardList,
  Compass,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  Moon,
  Package,
  Settings as SettingsIcon,
  Sun,
  Trophy,
  Users,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth, useTheme } from '@/store/auth'
import { Avatar } from './ui'
import { StreakFlame } from './gamified'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
}

const navByRole: Record<string, NavItem[]> = {
  student: [
    { to: '/student', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/student/quizzes', label: 'Quizzes', icon: <Compass size={18} /> },
    { to: '/student/flashcards', label: 'Flashcards', icon: <Layers size={18} /> },
    { to: '/student/badges', label: 'Badges', icon: <Award size={18} /> },
    { to: '/student/leaderboard', label: 'Leaderboard', icon: <Trophy size={18} /> },
  ],
  teacher: [
    { to: '/teacher', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/teacher/quizzes', label: 'My Quizzes', icon: <ClipboardList size={18} /> },
    { to: '/teacher/classrooms', label: 'Classrooms', icon: <Users size={18} /> },
    { to: '/teacher/assignments', label: 'Assignments', icon: <CalendarClock size={18} /> },
    { to: '/teacher/packs', label: 'Content Packs', icon: <Package size={18} /> },
  ],
  parent: [
    { to: '/parent', label: 'Overview', icon: <LayoutDashboard size={18} /> },
  ],
}

const ROLE_LABEL: Record<string, string> = {
  student: 'Adventurer',
  teacher: 'Quest Master',
  parent: 'Guide',
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 text-lg shadow-lg shadow-brand-600/30">
        🧭
      </span>
      <span className="font-display text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
        Open<span className="text-gradient">Path</span>
      </span>
    </span>
  )
}

function navItems(role: string): NavItem[] {
  return [
    ...(navByRole[role] ?? []),
    { to: '/settings', label: 'Settings', icon: <SettingsIcon size={18} /> },
  ]
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const [theme, toggleTheme] = useTheme()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  if (!user) return null
  const items = navItems(user.role)

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-2 py-1">
        <Logo />
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/student' || item.to === '/teacher' || item.to === '/parent'}
            onClick={() => setDrawerOpen(false)}
            className={({ isActive }) =>
              cn('nav-item', isActive && 'nav-item-active')
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-white/10">
        {user.role === 'student' && (
          <div className="flex items-center justify-between px-1">
            <StreakFlame days={user.streakDays} />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Lv {user.level} · {user.xp} XP
            </span>
          </div>
        )}
        <div className="flex items-center gap-3 px-1">
          <Avatar name={user.name} color={user.avatarColor} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {user.name}
            </p>
            <p className="text-xs text-slate-400">{ROLE_LABEL[user.role]}</p>
          </div>
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={logout}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-500"
            aria-label="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-ink-950">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl animate-float-slow dark:bg-brand-600/20" />
        <div className="absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-violet-500/15 blur-3xl animate-float dark:bg-violet-600/15" />
      </div>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white/80 backdrop-blur-xl lg:block dark:border-white/10 dark:bg-ink-900/70">
        {sidebar}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-xl lg:hidden dark:border-white/10 dark:bg-ink-900/70">
        <Logo />
        <div className="flex items-center gap-2">
          {user.role === 'student' && <StreakFlame days={user.streakDays} />}
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              className="absolute inset-y-0 left-0 w-72 border-r border-slate-200 bg-white dark:border-white/10 dark:bg-ink-900"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            >
              <button
                onClick={() => setDrawerOpen(false)}
                className="absolute right-3 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
              {sidebar}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-6 lg:pl-64 lg:pr-8 lg:pt-8">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}
