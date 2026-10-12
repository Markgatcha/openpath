import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Button ─────────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
}

export function Button({
  variant = 'primary',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          aria-hidden
        />
      )}
      {children}
    </button>
  )
}

// ── Card ───────────────────────────────────────────────────────
export function Card({
  className,
  children,
  hover = false,
  ...props
}: {
  className?: string
  children: ReactNode
  hover?: boolean
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('card', hover && 'card-hover', className)} {...props}>
      {children}
    </div>
  )
}

// ── Field wrappers ─────────────────────────────────────────────
export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      <span className="label">{label}</span>
      {children}
      {hint && (
        <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </span>
      )}
    </label>
  )
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('input', className)} {...props} />
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('input resize-y', className)} {...props} />
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn('input cursor-pointer', className)} {...props}>
      {children}
    </select>
  )
}

// ── Badge / Chip ───────────────────────────────────────────────
export function Chip({
  className,
  children,
  color = 'slate',
}: {
  className?: string
  children: ReactNode
  color?: 'slate' | 'brand' | 'gold' | 'emerald' | 'rose' | 'amber'
}) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
    brand: 'bg-brand-500/15 text-brand-600 dark:text-brand-300',
    gold: 'bg-gold-500/15 text-gold-500 dark:text-gold-400',
    emerald: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
    rose: 'bg-rose-500/15 text-rose-600 dark:text-rose-300',
    amber: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
  }
  return <span className={cn('chip', colors[color], className)}>{children}</span>
}

// ── Progress bar ───────────────────────────────────────────────
export function ProgressBar({
  value,
  className,
  barClassName,
}: {
  value: number
  className?: string
  barClassName?: string
}) {
  return (
    <div
      className={cn(
        'h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10',
        className,
      )}
    >
      <motion.div
        className={cn(
          'h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-400',
          barClassName,
        )}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      />
    </div>
  )
}

// ── Avatar ──────────────────────────────────────────────────────
export function Avatar({
  name,
  color,
  size = 'md',
  className,
}: {
  name: string
  color: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
    xl: 'h-20 w-20 text-2xl',
  }
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white',
        sizes[size],
        className,
      )}
      style={{ backgroundColor: color }}
      aria-hidden
    >
      {initials}
    </span>
  )
}

// ── Modal ───────────────────────────────────────────────────────
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm dark:bg-black/70"
            onClick={onClose}
          />
          <motion.div
            className={cn(
              'card relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto p-6',
              className,
            )}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

// ── Tabs ───────────────────────────────────────────────────────
interface TabsProps {
  tabs: { id: string; label: string }[]
  active: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        'inline-flex gap-1 rounded-xl border border-slate-200 bg-slate-100/60 p-1 dark:border-white/10 dark:bg-white/5',
        className,
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'rounded-lg px-3.5 py-1.5 text-sm font-semibold transition',
            active === tab.id
              ? 'bg-white text-brand-600 shadow-sm dark:bg-white/10 dark:text-brand-300'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-white/10">
      {icon && <div className="text-3xl">{icon}</div>}
      <h3 className="font-display text-base font-bold text-slate-700 dark:text-slate-200">
        {title}
      </h3>
      {description && (
        <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
      {action}
    </div>
  )
}

// ── Spinner ────────────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand-500 dark:border-white/20 dark:border-t-brand-400',
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  )
}

// ── Toggle ─────────────────────────────────────────────────────
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5 text-sm font-medium text-slate-600 dark:text-slate-300"
    >
      <span
        className={cn(
          'relative h-6 w-11 rounded-full transition',
          checked ? 'bg-brand-500' : 'bg-slate-300 dark:bg-white/15',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
            checked ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </span>
      {label}
    </button>
  )
}

// ── Toast (lightweight, via context) ───────────────────────────
interface Toast {
  id: number
  message: string
  tone: 'success' | 'error' | 'info'
}

const ToastContext = createContext<(message: string, tone?: Toast['tone']) => void>(
  () => {},
)

export function useToast() {
  return useContext(ToastContext)
}

let toastSeq = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const push = (message: string, tone: Toast['tone'] = 'info') => {
    const id = ++toastSeq
    idRef.current = id
    setToasts((current) => [...current, { id, message, tone }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 3600)
  }

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              className={cn(
                'pointer-events-auto rounded-xl px-4 py-2.5 text-sm font-semibold shadow-lg backdrop-blur',
                toast.tone === 'success' &&
                  'bg-emerald-500/95 text-white',
                toast.tone === 'error' && 'bg-rose-500/95 text-white',
                toast.tone === 'info' &&
                  'bg-slate-800/95 text-white dark:bg-white/15',
              )}
            >
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

// ── Copyable code ──────────────────────────────────────────────
export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const id = useId()

  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(code)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1500)
      }}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
      aria-describedby={id}
    >
      {code}
      <span id={id} className="text-xs font-sans font-normal text-slate-400">
        {copied ? 'copied!' : 'click to copy'}
      </span>
    </button>
  )
}
