import { createContext, useContext } from 'react'

/**
 * Shared three-free model parameter, readout, challenge, and runtime
 * context contracts used by both 3D (`engine.ts`) and 2D (`engine2d.ts`)
 * interactive models. Keeping this module free of `three` guarantees 2D
 * models and `<ModelEmbed>` never pull WebGL into the initial bundle.
 */

export interface SliderParam {
  kind: 'slider'
  id: string
  label: string
  min: number
  max: number
  step: number
  initial: number
  unit?: string
  /** Screen-reader friendly value text. */
  format?: (value: number) => string
}

export interface ChoiceParam {
  kind: 'choice'
  id: string
  label: string
  /** The param value is the index of the selected choice. */
  choices: string[]
  initial: number
}

export interface ToggleParam {
  kind: 'toggle'
  id: string
  label: string
  initial: boolean
}

export type ParamDef = SliderParam | ChoiceParam | ToggleParam
export type Params = Record<string, number>

export interface Readout {
  label: string
  value: string
}

export interface ModelHotspotInfo {
  id: string
  label: string
  title: string
  body: string
}

export interface ModelChallenge {
  id: string
  title: string
  /** Optional preset applied and locked during Phase 1 (Predict). */
  setupParams?: Params
  /** Phase 1 (Predict): Commit to a choice before manipulating. */
  predict: {
    prompt: string
    options: string[]
    correctIndex: number
  }
  /** Phase 2 (Manipulate): Live goal/condition checked against current params & sim metrics. */
  manipulate?: {
    instruction: string
    evaluate: (
      params: Params,
      metrics: Record<string, number>,
    ) => { passed: boolean; feedback: string }
  }
  /** Phase 3 (Explain): Conceptual reconciliation shown after testing. */
  explain: string
  misconceptionTag: string
}

export const PALETTE = {
  brand: 0x818cf8,
  violet: 0xa78bfa,
  cyan: 0x22d3ee,
  emerald: 0x34d399,
  amber: 0xfbbf24,
  rose: 0xfb7185,
  slate: 0x94a3b8,
  white: 0xf8fafc,
} as const

export const PALETTE_CSS = {
  brand: '#818cf8',
  violet: '#a78bfa',
  cyan: '#22d3ee',
  emerald: '#34d399',
  amber: '#fbbf24',
  rose: '#fb7185',
  slate: '#94a3b8',
  white: '#f8fafc',
} as const

export function initialParams(defs: ParamDef[]): Params {
  const out: Params = {}
  for (const def of defs) {
    out[def.id] = def.kind === 'toggle' ? (def.initial ? 1 : 0) : def.initial
  }
  return out
}

export function mergeInitialParams(
  defs: ParamDef[],
  overrides?: Record<string, number | boolean>,
): Params {
  const base = initialParams(defs)
  if (!overrides) return base
  for (const def of defs) {
    const rawVal = overrides[def.id]
    if (rawVal === undefined) continue
    const raw = typeof rawVal === 'boolean' ? (rawVal ? 1 : 0) : rawVal
    if (typeof raw !== 'number' || !Number.isFinite(raw)) continue
    if (def.kind === 'toggle') {
      base[def.id] = raw >= 0.5 ? 1 : 0
    } else if (def.kind === 'choice') {
      base[def.id] = Math.max(0, Math.min(def.choices.length - 1, Math.round(raw)))
    } else {
      base[def.id] = Math.max(def.min, Math.min(def.max, raw))
    }
  }
  return base
}

export interface ModelRuntimeConfig {
  initialParams?: Record<string, number | boolean>
  lockedParams?: boolean | string[]
  highlightHotspots?: string[]
  hideLabels?: boolean
  compact?: boolean
  challengeId?: string
  defaultTab?: 'explore' | 'challenge'
  onChallengeSolved?: (challengeId: string, modelId: string) => void
  onHotspotSelect?: (spot: ModelHotspotInfo) => void
  onReadoutSnapshot?: (readouts: Readout[], params: Params) => void
}

export const ModelRuntimeContext = createContext<ModelRuntimeConfig | null>(null)

export function useModelRuntime(): ModelRuntimeConfig | null {
  return useContext(ModelRuntimeContext)
}

export function isParamLocked(
  paramId: string,
  lockedParams: boolean | string[] | undefined,
  phaseLocked: boolean,
): boolean {
  if (phaseLocked) return true
  if (lockedParams === true) return true
  if (Array.isArray(lockedParams)) return lockedParams.includes(paramId)
  return false
}
