import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, TriangleAlert } from 'lucide-react'
import { Chip, Field, Select } from '@/components/ui'
import { FigureCanvas } from '@/components/FigureCanvas'
import {
  ASKS_BY_TEMPLATE,
  FIGURE_TEMPLATES,
  ROUNDINGS,
  buildFigureGeometry,
  computeAnswer,
  roundValue,
  validateFigure,
  type FigureSpec,
  type FigureTemplate,
  type Rounding,
} from '@shared/figure'

const TEMPLATE_LABELS: Record<FigureTemplate, string> = {
  'triangle-sas': 'Triangle — two sides + included angle (SAS)',
  'triangle-sss': 'Triangle — three sides (SSS)',
  'triangle-asa': 'Triangle — two angles + side (ASA)',
  'right-triangle': 'Right triangle',
  circle: 'Circle',
  trapezoid: 'Trapezoid',
}

const GIVEN_LABELS: Record<string, string> = {
  a: 'side a',
  b: 'side b',
  c: 'side c (hypotenuse)',
  angleA: 'angle A (°)',
  angleB: 'angle B (°)',
  angleC: 'angle C (°)',
  r: 'radius r',
  d: 'diameter d',
  b1: 'base 1',
  b2: 'base 2',
  h: 'height',
}

const ASK_LABELS: Record<string, string> = {
  a: 'side a',
  b: 'side b',
  c: 'side c (hypotenuse)',
  angleA: 'angle A',
  angleB: 'angle B',
  angleC: 'angle C',
  area: 'area',
  radius: 'radius',
  diameter: 'diameter',
  circumference: 'circumference',
  midsegment: 'midsegment',
}

const FIXED_GIVENS: Record<string, string[]> = {
  'triangle-sas': ['b', 'c', 'angleA'],
  'triangle-sss': ['a', 'b', 'c'],
  'triangle-asa': ['angleA', 'b', 'angleC'],
  circle: [],
  trapezoid: ['b1', 'b2', 'h'],
}

const RIGHT_TRIANGLE_KEYS = ['a', 'b', 'c', 'angleA', 'angleB']

function isAngleKey(key: string): boolean {
  return key.startsWith('angle')
}

/**
 * Figure question editor: template + givens + ask. The answer key is
 * computed live and shown to the teacher as a sanity check — it is
 * never typed by hand.
 */
export function FigureSection({
  figure,
  onChange,
}: {
  figure: FigureSpec
  onChange: (figure: FigureSpec) => void
}) {
  const problem = validateFigure(figure)

  const [rightRows, setRightRows] = useState<{ key: string; value: string }[]>(
    () => {
      if (figure.template !== 'right-triangle') return []
      return Object.entries(figure.givens).map(([key, value]) => ({
        key,
        value: String(value),
      }))
    },
  )

  const preview = useMemo(() => {
    if (problem) return null
    try {
      const geometry = buildFigureGeometry(figure)
      const answer = roundValue(computeAnswer(figure), figure.rounding)
      return { geometry, answer }
    } catch {
      return null
    }
  }, [figure, problem])

  const askOptions = ASKS_BY_TEMPLATE[figure.template].filter((ask) => {
    // Don't offer to ask for something that's given.
    if (figure.template === 'circle') {
      return !(ask === 'radius' && figure.givens.r) && !(ask === 'diameter' && figure.givens.d)
    }
    return true
  })

  const setTemplate = (template: FigureTemplate) => {
    const firstAsk = ASKS_BY_TEMPLATE[template][0]
    const givens: Record<string, number> = {}
    if (template === 'triangle-sas') {
      givens.b = 7
      givens.c = 5
      givens.angleA = 40
    } else if (template === 'triangle-sss') {
      givens.a = 5
      givens.b = 6
      givens.c = 7
    } else if (template === 'triangle-asa') {
      givens.angleA = 40
      givens.b = 8
      givens.angleC = 60
    } else if (template === 'right-triangle') {
      givens.a = 3
      givens.b = 4
    } else if (template === 'circle') {
      givens.r = 6
    } else if (template === 'trapezoid') {
      givens.b1 = 10
      givens.b2 = 6
      givens.h = 4
    }
    setRightRows(
      template === 'right-triangle'
        ? Object.entries(givens).map(([key, value]) => ({ key, value: String(value) }))
        : [],
    )
    onChange({ ...figure, template, givens, ask: firstAsk })
  }

  const setGiven = (key: string, raw: string) => {
    const value = Number(raw)
    const givens = { ...figure.givens }
    if (raw === '' || !Number.isFinite(value)) {
      delete givens[key]
    } else {
      givens[key] = value
    }
    onChange({ ...figure, givens })
  }

  const setAsk = (ask: string) => onChange({ ...figure, ask })
  const setRounding = (rounding: Rounding) => onChange({ ...figure, rounding })

  const updateRightRows = (rows: { key: string; value: string }[]) => {
    setRightRows(rows)
    const givens: Record<string, number> = {}
    for (const row of rows) {
      const value = Number(row.value)
      if (row.key && row.value !== '' && Number.isFinite(value)) {
        givens[row.key] = value
      }
    }
    onChange({ ...figure, givens })
  }

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-brand-500/20 bg-brand-500/5 p-4">
      <div className="flex items-center justify-between">
        <span className="label mb-0">Figure</span>
        {problem ? (
          <Chip color="rose">
            <TriangleAlert size={11} /> needs input
          </Chip>
        ) : (
          <Chip color="emerald">
            <Check size={11} /> solvable
          </Chip>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Shape template">
          <Select
            value={figure.template}
            onChange={(event) => setTemplate(event.target.value as FigureTemplate)}
          >
            {FIGURE_TEMPLATES.map((template) => (
              <option key={template} value={template}>
                {TEMPLATE_LABELS[template]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Ask the student for">
          <Select value={figure.ask} onChange={(event) => setAsk(event.target.value)}>
            {askOptions.map((ask) => (
              <option key={ask} value={ask}>
                {ASK_LABELS[ask] ?? ask}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {/* Givens */}
      <div>
        <span className="label">Givens (shown on the figure)</span>
        {figure.template === 'circle' ? (
          <div className="flex items-center gap-3">
            <Select
              value={figure.givens.r ? 'r' : 'd'}
              onChange={(event) => {
                const key = event.target.value
                const givens: Record<string, number> = { [key]: 6 }
                onChange({ ...figure, givens, ask: key === 'r' ? 'area' : 'radius' })
              }}
              className="max-w-40"
            >
              <option value="r">radius r</option>
              <option value="d">diameter d</option>
            </Select>
            <input
              type="number"
              className="input max-w-32"
              min={0.5}
              step="any"
              value={figure.givens.r ?? figure.givens.d ?? ''}
              onChange={(event) =>
                setGiven(figure.givens.r ? 'r' : 'd', event.target.value)
              }
            />
          </div>
        ) : figure.template === 'right-triangle' ? (
          <div className="flex flex-col gap-2">
            {[0, 1].map((rowIndex) => {
              const row = rightRows[rowIndex] ?? { key: '', value: '' }
              return (
                <div key={rowIndex} className="flex items-center gap-2">
                  <Select
                    value={row.key}
                    onChange={(event) => {
                      const next = [...rightRows]
                      next[rowIndex] = { ...row, key: event.target.value }
                      updateRightRows(next)
                    }}
                    className="max-w-44"
                  >
                    <option value="">pick a given…</option>
                    {RIGHT_TRIANGLE_KEYS.map((key) => (
                      <option
                        key={key}
                        value={key}
                        disabled={rightRows.some((other, i) => i !== rowIndex && other.key === key)}
                      >
                        {GIVEN_LABELS[key]}
                      </option>
                    ))}
                  </Select>
                  <input
                    type="number"
                    className="input max-w-32"
                    min={0.5}
                    step="any"
                    placeholder="value"
                    value={row.value}
                    onChange={(event) => {
                      const next = [...rightRows]
                      next[rowIndex] = { ...row, value: event.target.value }
                      updateRightRows(next)
                    }}
                  />
                </div>
              )
            })}
            <p className="text-xs text-slate-400">
              Exactly two givens: two sides, or one side and one angle.
            </p>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-3">
            {FIXED_GIVENS[figure.template]?.map((key) => (
              <label key={key} className="block">
                <span className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {GIVEN_LABELS[key]}
                </span>
                <input
                  type="number"
                  className="input"
                  min={0.5}
                  step="any"
                  value={figure.givens[key] ?? ''}
                  onChange={(event) => setGiven(key, event.target.value)}
                />
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Rounding">
          <Select
            value={figure.rounding}
            onChange={(event) => setRounding(event.target.value as Rounding)}
          >
            {ROUNDINGS.map((rounding) => (
              <option key={rounding} value={rounding}>
                {rounding === 'exact' ? 'exact' : `nearest ${rounding}`}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {/* Live preview + computed answer */}
      {preview && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5"
        >
          <FigureCanvas geometry={preview.geometry} size={170} />
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Answer key (computed)
            </span>
            <span className="font-display text-3xl font-extrabold text-emerald-500">
              {preview.answer}
            </span>
            <p className="max-w-56 text-xs text-slate-400">
              Students are graded with tolerance for the {figure.rounding} rounding.
              Grader: {isAngleKey(figure.ask) ? 'degrees (°)' : 'units'}.
            </p>
          </div>
        </motion.div>
      )}

      {problem && (
        <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-300">
          {problem}
        </p>
      )}
    </div>
  )
}
