import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** 0.834 → 83 */
export function pct(value: number): number {
  return Math.round(value * 100)
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest === 0 ? `${minutes}m` : `${minutes}m ${rest}s`
}

export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return format(new Date(iso.replace(' ', 'T') + 'Z'), 'MMM d, yyyy')
  } catch {
    return '—'
  }
}

export function formatDayLabel(iso: string): string {
  try {
    return format(new Date(`${iso}T00:00:00Z`), 'EEE')
  } catch {
    return iso
  }
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return 'never'
  try {
    return formatDistanceToNow(new Date(iso.replace(' ', 'T') + 'Z'), {
      addSuffix: true,
    })
  } catch {
    return '—'
  }
}

export const SUBJECT_EMOJI: Record<string, string> = {
  Science: '🔬',
  Geography: '🌍',
  Math: '📐',
  Mathematics: '📐',
  History: '📜',
  English: '📖',
  Language: '🗣️',
  Art: '🎨',
  Music: '🎵',
  Computer: '💻',
  General: '✨',
}

export function subjectEmoji(subject: string): string {
  return SUBJECT_EMOJI[subject] ?? '✨'
}

export const DIFFICULTY_STYLES: Record<string, string> = {
  easy: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
  medium: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
  hard: 'bg-rose-500/15 text-rose-600 dark:text-rose-300',
}
