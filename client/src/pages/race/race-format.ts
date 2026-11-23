import type { RaceMode } from '@shared/schemas'
import type { RacePingTag } from '@shared/types'

export const RACE_PING_OPTIONS: {
  tag: RacePingTag
  label: string
  short: string
  keyHint: string
}[] = [
  { tag: 'hold', label: 'Hold on!', short: 'Hold', keyHint: '1' },
  { tag: 'think-mine', label: 'Think it’s mine', short: 'Mine!', keyHint: '2' },
  { tag: 'check-units', label: 'Check units / signs', short: 'Units?', keyHint: '3' },
  { tag: 'ready', label: 'Ready to lock in', short: 'Ready', keyHint: '4' },
]

export function racePingLabel(tag: RacePingTag | null | undefined): string | null {
  if (!tag) return null
  return RACE_PING_OPTIONS.find((item) => item.tag === tag)?.short ?? tag
}

export const RACE_MODE_OPTIONS: {
  mode: RaceMode
  title: string
  badge: string
  description: string
}[] = [
  {
    mode: 'classic',
    title: 'Classic Sprint',
    badge: 'Individual',
    description: 'Everyone answers simultaneously; speed bonus + streaks score high.',
  },
  {
    mode: 'squad-sync',
    title: 'Asymmetric Squad Sync',
    badge: 'Squads · 2–5',
    description:
      'Options split across squadmates so teams talk & coordinate via non-verbal pings (-2 checkpoint relay penalty on miss).',
  },
  {
    mode: 'classroom-siege',
    title: 'Classroom Siege',
    badge: 'Full-Class Co-op',
    description:
      'Shared Boss HP + Team Aegis Shield; rapid misses crack a seal and trigger a 3s recalibration pause.',
  },
]

/**
 * Human-readable rendering of a race reveal's stored correct answer.
 *
 * Storage is terse (an option index for MCQ, an index array for
 * ordering), so the reveal would otherwise show "1" where the class
 * just read "Berlin". The question's options — present on both the
 * host and student screens during the reveal — resolve the indices.
 */
export function formatRaceAnswer(
  value: unknown,
  options?: string[] | null,
): string {
  if (Array.isArray(value)) {
    const labels = value.map((item) => {
      const index = Number(item)
      return options && options[index] !== undefined ? options[index] : String(item)
    })
    return labels.join(' → ')
  }
  if (typeof value === 'number') {
    // MCQ stores the option index; figure questions answer with the
    // number itself (and carry no options), so this only fires for
    // real indices.
    if (options && options[value] !== undefined) return options[value]
    return String(value)
  }
  if (typeof value === 'boolean') return value ? 'True' : 'False'
  if (typeof value === 'string') return value
  return ''
}
