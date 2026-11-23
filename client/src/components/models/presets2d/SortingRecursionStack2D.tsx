import { Interactive2DViewer } from '../Interactive2DViewer'
import { PALETTE_CSS, type Model2DDefinition, type Params } from '../engine2d'

interface StackFrame {
  label: string
  lo: number
  hi: number
}

interface SortStep {
  arr: number[]
  compareA: number
  compareB: number
  writeIdx: number
  stack: StackFrame[]
  comparisons: number
  writes: number
}

function makeArray(n: number, order: number): number[] {
  const arr: number[] = []
  for (let i = 0; i < n; i += 1) arr.push(i + 1)
  if (order === 1) return arr.reverse() // Reversed
  if (order === 2) {
    // Nearly sorted: swap every 7th neighbor
    for (let i = 1; i < n; i += 7) {
      const tmp = arr[i - 1]
      arr[i - 1] = arr[i]
      arr[i] = tmp
    }
    return arr
  }
  // Deterministic Fisher-Yates shuffle
  let seed = n * 7919 + 42
  for (let i = n - 1; i > 0; i -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    const j = seed % (i + 1)
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

function recordSortTrace(algo: number, order: number, size: number): SortStep[] {
  const a = makeArray(size, order)
  const steps: SortStep[] = []
  let comparisons = 0
  let writes = 0
  const maxFrames = 3200

  const snap = (
    cA: number,
    cB: number,
    wI: number,
    stack: StackFrame[],
    force = false,
  ) => {
    // Subsample gracefully for N=128 quadratic runs so memory stays crisp
    const stride = size > 48 && algo === 0 ? 4 : size > 64 ? 2 : 1
    if (!force && steps.length % stride !== 0 && steps.length < maxFrames) {
      // keep stride compact only when trace gets long
    }
    if (steps.length >= maxFrames) return
    steps.push({
      arr: [...a],
      compareA: cA,
      compareB: cB,
      writeIdx: wI,
      stack: stack.map((f) => ({ ...f })),
      comparisons,
      writes,
    })
  }

  snap(-1, -1, -1, [{ label: 'main()', lo: 0, hi: size - 1 }], true)

  if (algo === 0) {
    // Insertion Sort
    for (let i = 1; i < size; i += 1) {
      const key = a[i]
      let j = i - 1
      while (j >= 0) {
        comparisons += 1
        snap(j, j + 1, -1, [{ label: `insert(i=${i})`, lo: 0, hi: i }])
        if (a[j] > key) {
          a[j + 1] = a[j]
          writes += 1
          j -= 1
        } else {
          break
        }
      }
      a[j + 1] = key
      writes += 1
    }
  } else if (algo === 1) {
    // Merge Sort
    const stack: StackFrame[] = []
    const mergeSort = (lo: number, hi: number) => {
      if (lo >= hi) return
      stack.push({ label: `mergeSort(${lo}..${hi})`, lo, hi })
      const mid = Math.floor((lo + hi) / 2)
      mergeSort(lo, mid)
      mergeSort(mid + 1, hi)

      const left = a.slice(lo, mid + 1)
      const right = a.slice(mid + 1, hi + 1)
      let i = 0
      let j = 0
      let k = lo
      while (i < left.length && j < right.length) {
        comparisons += 1
        snap(lo + i, mid + 1 + j, k, stack)
        if (left[i] <= right[j]) {
          a[k] = left[i]
          i += 1
        } else {
          a[k] = right[j]
          j += 1
        }
        writes += 1
        k += 1
      }
      while (i < left.length) {
        a[k] = left[i]
        writes += 1
        snap(-1, -1, k, stack)
        i += 1
        k += 1
      }
      while (j < right.length) {
        a[k] = right[j]
        writes += 1
        snap(-1, -1, k, stack)
        j += 1
        k += 1
      }
      stack.pop()
    }
    mergeSort(0, size - 1)
  } else {
    // Quicksort (last-element pivot)
    const stack: StackFrame[] = []
    const qsort = (lo: number, hi: number) => {
      if (lo >= hi) return
      stack.push({ label: `qsort(${lo}..${hi})`, lo, hi })
      const pivot = a[hi]
      let store = lo
      for (let j = lo; j < hi; j += 1) {
        comparisons += 1
        snap(j, hi, -1, stack)
        if (a[j] < pivot) {
          const tmp = a[store]
          a[store] = a[j]
          a[j] = tmp
          writes += 2
          store += 1
        }
      }
      const tmp = a[store]
      a[store] = a[hi]
      a[hi] = tmp
      writes += 2
      snap(-1, -1, store, stack)
      qsort(lo, store - 1)
      qsort(store + 1, hi)
      stack.pop()
    }
    qsort(0, size - 1)
  }

  snap(-1, -1, -1, [], true)
  return steps
}

export const sortingRecursionStack2dModel: Model2DDefinition = {
  id: 'sorting-recursion-stack-2d',
  title: 'Sorting Algorithms & Recursion Call Stack',
  subtitle:
    'Watch Insertion Sort, Merge Sort, and Quicksort across Random, Reversed, and Nearly-Sorted inputs (N = 8..128) with live call-stack frames.',
  viewWidth: 720,
  viewHeight: 460,
  supportsStep: true,
  params: [
    {
      kind: 'choice',
      id: 'algo',
      label: 'Algorithm',
      choices: ['Insertion Sort', 'Merge Sort', 'Quicksort (last pivot)'],
      initial: 1,
    },
    {
      kind: 'choice',
      id: 'order',
      label: 'Initial Array Order',
      choices: ['Random', 'Reversed', 'Nearly Sorted'],
      initial: 0,
    },
    {
      kind: 'slider',
      id: 'arraySize',
      label: 'Array length N',
      min: 8,
      max: 128,
      step: 8,
      initial: 24,
    },
    {
      kind: 'slider',
      id: 'speed',
      label: 'Playback speed (steps/s)',
      min: 2,
      max: 60,
      step: 2,
      initial: 16,
    },
  ],
  challenges: [
    {
      id: 'quicksort-degenerate-pivot',
      title: 'The Sorted Quicksort Trap',
      setupParams: { algo: 2, order: 1, arraySize: 24, speed: 30 },
      predict: {
        prompt:
          'When Quicksort always picks the LAST element as pivot on a Reversed array of size N = 24, what happens to recursion depth and comparisons?',
        options: [
          'Degrades to O(n²) comparisons (~276) and O(n) deep unbalanced call stack',
          'Runs fastest possible O(n log n) with balanced log₂ n depth (~5)',
          'Finishes in O(n) linear time with zero swaps',
        ],
        correctIndex: 0,
      },
      manipulate: {
        instruction:
          'Run Merge Sort on the SAME Reversed array of N = 24 (step to completion) and observe how comparisons stay under ~105.',
        evaluate: (p, m) => ({
          passed: p.algo === 1 && p.order === 1 && p.arraySize === 24 && m.done === 1 && m.comparisons <= 110,
          feedback: `Merge Sort done=${m.done === 1 ? 'Yes' : 'Running'}, comparisons = ${m.comparisons}. (Compare vs Reversed Quicksort's 276!)`,
        }),
      },
      explain:
        'A naive last-element pivot splits an already-sorted or reversed array into sizes 0 and n−1 every time — blowing up both work O(n²) and stack depth O(n), whereas Merge Sort always halves to O(n log n).',
      misconceptionTag: 'quicksort-always-nlogn',
    },
    {
      id: 'adaptive-insertion-sort',
      title: 'When O(n²) Beats O(n log n)',
      setupParams: { algo: 0, order: 2, arraySize: 32, speed: 30 },
      predict: {
        prompt:
          'On a Nearly-Sorted input of N = 32, how does Insertion Sort behave compared to Merge Sort?',
        options: [
          'Adaptive O(n) — almost every element skips the inner while-loop (< 55 comparisons!)',
          'Still executes ~1,000 quadratic comparisons regardless of input order',
          'Crashes on duplicate or sorted pairs',
        ],
        correctIndex: 0,
      },
      manipulate: {
        instruction:
          'Keep Insertion Sort + Nearly Sorted (N = 32) and let it finish sorting to confirm total comparisons < 60.',
        evaluate: (p, m) => ({
          passed: p.algo === 0 && p.order === 2 && p.arraySize === 32 && m.done === 1 && m.comparisons < 60,
          feedback: `Insertion Sort finished=${m.done === 1 ? 'Yes' : 'Wait'}, comparisons = ${m.comparisons}.`,
        }),
      },
      explain:
        'Because Insertion Sort halts its backward scan immediately once a[j] <= key, nearly-sorted arrays trigger O(1) checks per item — the reason Timsort uses Insertion Sort on small/sorted runs.',
      misconceptionTag: 'insertion-sort-never-adaptive',
    },
  ],
  build: (_ctx, initial) => {
    let key = ''
    let trace: SortStep[] = []
    let cursor = 0
    let accum = 0

    const ensureTrace = (p: Params) => {
      const algo = Math.round(p.algo ?? 1)
      const order = Math.round(p.order ?? 0)
      const size = Math.round(p.arraySize ?? 24)
      const nextKey = `${algo}:${order}:${size}`
      if (nextKey !== key) {
        key = nextKey
        trace = recordSortTrace(algo, order, size)
        cursor = 0
        accum = 0
      }
      return { algo, order, size }
    }

    ensureTrace(initial)

    return {
      actions: [{ id: 'finish', label: 'Run to End' }],
      update: (p, dt) => {
        if (dt <= 0) return
        ensureTrace(p)
        const rate = p.speed ?? 16
        accum += dt * rate
        if (accum >= 1) {
          const advance = Math.floor(accum)
          accum -= advance
          cursor = Math.min(trace.length - 1, cursor + advance)
        }
      },
      step: (p, dir, actionId) => {
        ensureTrace(p)
        if (actionId === 'finish') {
          cursor = trace.length - 1
          return
        }
        cursor = Math.max(0, Math.min(trace.length - 1, cursor + dir))
      },
      reset: (p) => {
        key = ''
        ensureTrace(p)
      },
      hotspots: [
        {
          id: 'bars',
          label: 'Array Bars',
          x: 230,
          y: 230,
          title: 'Active Array Slice & Comparisons',
          body: 'Amber bars are currently compared; rose highlights writes/swaps; brand-violet highlights the active recursive subrange; emerald shows sorted completion.',
        },
        {
          id: 'call-stack',
          label: 'Call Stack',
          x: 590,
          y: 165,
          title: 'Live Recursion Call Stack',
          body: 'Each nested subproblem pushes a stack frame. Balanced Merge Sort keeps stack depth at ~log₂(N), while unbalanced Quicksort grows linearly toward N frames.',
        },
      ],
      renderCanvas: (ctx, p) => {
        const { size } = ensureTrace(p)
        const step = trace[cursor] ?? trace[0]
        const done = cursor >= trace.length - 1

        ctx.save()
        // Array bar canvas
        const bx = 28
        const by = 46
        const bw = 442
        const bh = 376
        ctx.fillStyle = 'rgba(15, 23, 42, 0.55)'
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)'
        ctx.fillRect(bx, by, bw, bh)
        ctx.strokeRect(bx, by, bw, bh)

        ctx.fillStyle = '#e2e8f0'
        ctx.font = 'bold 11px ui-sans-serif, system-ui, sans-serif'
        ctx.fillText(
          `Array (N = ${size}) — Step ${cursor}/${trace.length - 1}${done ? ' ✓ Sorted' : ''}`,
          bx + 4,
          by - 8,
        )

        const topFrame = step.stack[step.stack.length - 1]
        const barSlot = (bw - 24) / step.arr.length
        const barW = Math.max(1.5, barSlot - (step.arr.length > 64 ? 0.5 : 1.5))

        step.arr.forEach((val, idx) => {
          const h = (val / size) * (bh - 34)
          const x = bx + 12 + idx * barSlot
          const y = by + bh - 12 - h
          let col: string = done ? PALETTE_CSS.emerald : PALETTE_CSS.cyan
          if (!done) {
            if (idx === step.writeIdx) col = PALETTE_CSS.rose
            else if (idx === step.compareA || idx === step.compareB) col = PALETTE_CSS.amber
            else if (topFrame && idx >= topFrame.lo && idx <= topFrame.hi) col = PALETTE_CSS.brand
          }
          ctx.fillStyle = col
          ctx.fillRect(x, y, barW, h)
        })

        // Right Panel: Call Stack & Complexity Counters
        const sx = 490
        const sy = 46
        const sw = 204
        const sh = 376
        ctx.fillStyle = 'rgba(15, 23, 42, 0.55)'
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)'
        ctx.fillRect(sx, sy, sw, sh)
        ctx.strokeRect(sx, sy, sw, sh)

        ctx.fillStyle = '#e2e8f0'
        ctx.font = 'bold 11px ui-sans-serif, system-ui, sans-serif'
        ctx.fillText('Call Stack & Counters', sx + 8, sy - 8)

        ctx.font = '11px ui-monospace, monospace'
        ctx.fillStyle = PALETTE_CSS.amber
        ctx.fillText(`Comparisons: ${step.comparisons}`, sx + 14, sy + 26)
        ctx.fillStyle = PALETTE_CSS.rose
        ctx.fillText(`Array Writes: ${step.writes}`, sx + 14, sy + 46)
        ctx.fillStyle = '#94a3b8'
        ctx.fillText(`n log₂ n ≈ ${Math.round(size * Math.log2(size))}`, sx + 14, sy + 66)

        ctx.fillStyle = PALETTE_CSS.violet
        ctx.font = 'bold 10px ui-sans-serif, system-ui, sans-serif'
        ctx.fillText(`Active Call Frames (${step.stack.length})`, sx + 14, sy + 94)

        const visibleStack = step.stack.slice(-9)
        visibleStack.forEach((f, idx) => {
          const fy = sy + 108 + idx * 28
          ctx.fillStyle = idx === visibleStack.length - 1 ? 'rgba(129, 140, 248, 0.35)' : 'rgba(51, 65, 85, 0.6)'
          ctx.strokeStyle = PALETTE_CSS.brand
          ctx.lineWidth = 1
          ctx.fillRect(sx + 14, fy, sw - 28, 22)
          ctx.strokeRect(sx + 14, fy, sw - 28, 22)
          ctx.fillStyle = '#f8fafc'
          ctx.font = '10px ui-monospace, monospace'
          ctx.fillText(f.label, sx + 22, fy + 15)
        })
        ctx.restore()
      },
      readouts: (p) => {
        const { size } = ensureTrace(p)
        const step = trace[cursor] ?? trace[0]
        return [
          { label: 'Comparisons', value: `${step.comparisons}` },
          { label: 'Array Writes', value: `${step.writes}` },
          { label: 'Stack Depth', value: `${step.stack.length}` },
          { label: 'Input Size N', value: `${size}` },
        ]
      },
      metrics: (p) => {
        ensureTrace(p)
        const step = trace[cursor] ?? trace[0]
        return {
          comparisons: step.comparisons,
          writes: step.writes,
          stackDepth: step.stack.length,
          done: cursor >= trace.length - 1 ? 1 : 0,
        }
      },
    }
  },
}

export default function SortingRecursionStack2D() {
  return <Interactive2DViewer model={sortingRecursionStack2dModel} />
}
