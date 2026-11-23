import { Interactive2DViewer } from '../Interactive2DViewer'
import { PALETTE_CSS, type Model2DDefinition, type Params } from '../engine2d'

interface GraphNode {
  id: string
  x: number
  y: number
}
interface GraphEdge {
  u: string
  v: string
  w: number
}
interface GraphScenario {
  name: string
  start: string
  goal: string
  nodes: GraphNode[]
  edges: GraphEdge[]
}

const SCENARIOS: GraphScenario[] = [
  {
    name: 'Trap: Cheap Multi-Hop vs Expensive Direct',
    start: 'S',
    goal: 'G',
    nodes: [
      { id: 'S', x: 75, y: 230 },
      { id: 'A', x: 185, y: 120 },
      { id: 'B', x: 295, y: 120 },
      { id: 'C', x: 395, y: 195 },
      { id: 'D', x: 225, y: 340 },
      { id: 'G', x: 435, y: 320 },
    ],
    edges: [
      { u: 'S', v: 'G', w: 12 }, // direct 1-hop trap!
      { u: 'S', v: 'A', w: 1 },
      { u: 'A', v: 'B', w: 1 },
      { u: 'B', v: 'C', w: 2 },
      { u: 'C', v: 'G', w: 1 }, // total cost S-A-B-C-G = 5!
      { u: 'S', v: 'D', w: 4 },
      { u: 'D', v: 'G', w: 5 }, // S-D-G = 9
      { u: 'A', v: 'D', w: 3 },
      { u: 'B', v: 'D', w: 2 },
    ],
  },
  {
    name: 'Diamond Network',
    start: 'S',
    goal: 'G',
    nodes: [
      { id: 'S', x: 70, y: 230 },
      { id: 'A', x: 185, y: 110 },
      { id: 'B', x: 185, y: 350 },
      { id: 'C', x: 315, y: 165 },
      { id: 'D', x: 315, y: 295 },
      { id: 'G', x: 440, y: 230 },
    ],
    edges: [
      { u: 'S', v: 'A', w: 2 },
      { u: 'S', v: 'B', w: 4 },
      { u: 'A', v: 'C', w: 3 },
      { u: 'A', v: 'D', w: 7 },
      { u: 'B', v: 'D', w: 2 },
      { u: 'B', v: 'C', w: 6 },
      { u: 'C', v: 'D', w: 1 },
      { u: 'C', v: 'G', w: 6 },
      { u: 'D', v: 'G', w: 2 },
    ],
  },
]

interface StepFrame {
  current: string | null
  settled: string[]
  frontier: string[]
  dist: Record<string, number>
  parent: Record<string, string | null>
  treeEdges: Array<[string, string]>
  finalPath: string[]
  finalCost: number
  note: string
}

function heuristic(nodes: GraphNode[], id: string, goal: string): number {
  const a = nodes.find((n) => n.id === id)
  const b = nodes.find((n) => n.id === goal)
  if (!a || !b) return 0
  // Admissible optimistic lower bound scaled cleanly to edge weights
  return Math.round((Math.hypot(a.x - b.x, a.y - b.y) / 95) * 10) / 10
}

function buildTrace(algo: number, scenarioIdx: number): StepFrame[] {
  const sc = SCENARIOS[scenarioIdx] ?? SCENARIOS[0]
  const adj = new Map<string, Array<{ to: string; w: number }>>()
  sc.nodes.forEach((n) => adj.set(n.id, []))
  sc.edges.forEach((e) => {
    adj.get(e.u)?.push({ to: e.v, w: e.w })
    adj.get(e.v)?.push({ to: e.u, w: e.w })
  })

  const frames: StepFrame[] = []
  const settled = new Set<string>()
  const dist: Record<string, number> = {}
  const parent: Record<string, string | null> = {}
  const treeEdges: Array<[string, string]> = []
  sc.nodes.forEach((n) => {
    dist[n.id] = Infinity
    parent[n.id] = null
  })
  dist[sc.start] = 0
  const frontier: string[] = [sc.start]

  const reconstructPath = (endId: string): string[] => {
    const out: string[] = []
    let cur: string | null = endId
    while (cur) {
      out.push(cur)
      cur = parent[cur] ?? null
    }
    return out.reverse()
  }

  const snap = (current: string | null, note: string, donePath: string[] = [], cost = 0): void => {
    frames.push({
      current,
      settled: [...settled],
      frontier: [...frontier],
      dist: { ...dist },
      parent: { ...parent },
      treeEdges: [...treeEdges],
      finalPath: donePath,
      finalCost: cost,
      note,
    })
  }

  snap(sc.start, `Initialize ${sc.start} with cost 0`)

  if (algo === 0) {
    // BFS (unweighted hop count!)
    while (frontier.length > 0) {
      const u = frontier.shift()!
      if (settled.has(u)) continue
      settled.add(u)
      if (parent[u]) treeEdges.push([parent[u]!, u])

      if (u === sc.goal) {
        const path = reconstructPath(sc.goal)
        let wSum = 0
        for (let i = 0; i < path.length - 1; i += 1) {
          const edge = adj.get(path[i])?.find((x) => x.to === path[i + 1])
          wSum += edge?.w ?? 0
        }
        snap(u, `BFS reached ${sc.goal} in ${path.length - 1} hop(s), weight = ${wSum}`, path, wSum)
        break
      }

      for (const nb of adj.get(u) ?? []) {
        if (!settled.has(nb.to) && !frontier.includes(nb.to)) {
          dist[nb.to] = dist[u] + 1
          parent[nb.to] = u
          frontier.push(nb.to)
        }
      }
      snap(u, `Expanded ${u} (BFS ignores edge weights)`)
    }
  } else if (algo === 1 || algo === 2) {
    // Dijkstra (1) or A* (2)
    const isAStar = algo === 2
    while (frontier.length > 0) {
      frontier.sort((a, b) => {
        const fa = dist[a] + (isAStar ? heuristic(sc.nodes, a, sc.goal) : 0)
        const fb = dist[b] + (isAStar ? heuristic(sc.nodes, b, sc.goal) : 0)
        return fa - fb
      })
      const u = frontier.shift()!
      if (settled.has(u)) continue
      settled.add(u)
      if (parent[u]) treeEdges.push([parent[u]!, u])

      if (u === sc.goal) {
        const path = reconstructPath(sc.goal)
        snap(u, `${isAStar ? 'A*' : 'Dijkstra'} found min-cost path = ${dist[sc.goal]}`, path, dist[sc.goal])
        break
      }

      for (const nb of adj.get(u) ?? []) {
        if (settled.has(nb.to)) continue
        const alt = dist[u] + nb.w
        if (alt < dist[nb.to]) {
          dist[nb.to] = alt
          parent[nb.to] = u
          if (!frontier.includes(nb.to)) frontier.push(nb.to)
        }
      }
      snap(u, `Settled ${u} (g=${dist[u]}) & relaxed neighbors`)
    }
  } else {
    // Prim's MST
    let totalMst = 0
    while (frontier.length > 0) {
      frontier.sort((a, b) => dist[a] - dist[b])
      const u = frontier.shift()!
      if (settled.has(u)) continue
      settled.add(u)
      if (parent[u]) {
        treeEdges.push([parent[u]!, u])
        totalMst += dist[u]
      }
      for (const nb of adj.get(u) ?? []) {
        if (!settled.has(nb.to) && nb.w < dist[nb.to]) {
          dist[nb.to] = nb.w
          parent[nb.to] = u
          if (!frontier.includes(nb.to)) frontier.push(nb.to)
        }
      }
      snap(
        u,
        settled.size === sc.nodes.length
          ? `Prim MST complete — total weight = ${totalMst}`
          : `Added ${u} to MST (edge=${parent[u] ? dist[u] : 0})`,
        [],
        totalMst,
      )
    }
  }

  return frames
}

export const graphPathfinding2dModel: Model2DDefinition = {
  id: 'graph-pathfinding-2d',
  title: 'Graph Search: BFS, Dijkstra, A* & Prim MST',
  subtitle:
    'Step node-by-node through frontier expansion and edge relaxation to compare hop count, weighted shortest paths, heuristics, and minimum spanning trees.',
  viewWidth: 720,
  viewHeight: 460,
  supportsStep: true,
  initialPaused: true,
  params: [
    {
      kind: 'choice',
      id: 'algo',
      label: 'Algorithm',
      choices: ['BFS (hops)', 'Dijkstra', 'A* (heuristic)', "Prim's MST"],
      initial: 1,
    },
    {
      kind: 'choice',
      id: 'scenario',
      label: 'Graph Topology',
      choices: ['Weight Trap (12 vs 5)', 'Diamond Network'],
      initial: 0,
    },
    {
      kind: 'slider',
      id: 'stepIndex',
      label: 'Execution Step',
      min: 0,
      max: 10,
      step: 1,
      initial: 0,
    },
    {
      kind: 'toggle',
      id: 'showHeuristics',
      label: 'Show g(n) & h(n) badges',
      initial: true,
    },
  ],
  challenges: [
    {
      id: 'bfs-weight-trap',
      title: 'When Shortest Hops ≠ Lowest Cost',
      setupParams: { algo: 0, scenario: 0, stepIndex: 0, showHeuristics: 1 },
      predict: {
        prompt:
          'On "Weight Trap", edge S→G costs 12 (1 hop), while S→A→B→C→G costs 1+1+2+1 = 5 (4 hops). Which path does BFS return?',
        options: [
          'BFS stops immediately on direct S→G (cost 12) because it ignores weights',
          'BFS automatically finds S→A→B→C→G (cost 5)',
          'BFS throws an error on weighted graphs',
        ],
        correctIndex: 0,
      },
      manipulate: {
        instruction:
          'Switch from BFS to Dijkstra (or A*) and advance Execution Step until the optimal path cost = 5 is locked in.',
        evaluate: (p, m) => ({
          passed: (p.algo === 1 || p.algo === 2) && p.scenario === 0 && m.finalCost === 5,
          feedback: `Current path cost = ${m.finalCost > 0 ? m.finalCost : 'not reached yet'}. Optimal weighted cost = 5.`,
        }),
      },
      explain:
        'Breadth-First Search uses a plain FIFO queue and terminates the moment G is dequeued in fewest edges — missing cheaper multi-hop routes that Dijkstra/A* discover via priority-queue relaxation.',
      misconceptionTag: 'bfs-finds-weighted-shortest-path',
    },
    {
      id: 'mst-vs-shortest-tree',
      title: 'Minimum Spanning Tree vs Shortest Path',
      setupParams: { algo: 3, scenario: 0, stepIndex: 0 },
      predict: {
        prompt:
          'Does Prim’s Minimum Spanning Tree (spanning ALL 6 vertices cheaply) minimize total graph weight, or shortest path to G?',
        options: [
          'Minimizes total spanning tree weight across all nodes (1+1+2+1+2 = 7), not any single pair path',
          'Always uses fewer edges than a path to G',
          'Identical to Dijkstra for every node and every graph',
        ],
        correctIndex: 0,
      },
      manipulate: {
        instruction:
          "Run Prim's MST to completion on Weight Trap (stepIndex >= 6) so all 6 vertices are settled with total MST weight = 7.",
        evaluate: (p, m) => ({
          passed: p.algo === 3 && p.scenario === 0 && m.settledCount === 6 && m.finalCost === 7,
          feedback: `Settled ${m.settledCount}/6 nodes, MST total weight = ${m.finalCost}.`,
        }),
      },
      explain:
        "Prim's MST minimizes the sum of the n−1 tree edges connecting every vertex, whereas Dijkstra/A* minimize cumulative distance from S to G.",
      misconceptionTag: 'confusing-mst-with-shortest-path-tree',
    },
  ],
  build: () => {
    let accum = 0
    const getFrame = (p: Params) => {
      const algo = Math.round(p.algo ?? 1)
      const scIdx = Math.round(p.scenario ?? 0)
      const trace = buildTrace(algo, scIdx)
      const idx = Math.max(0, Math.min(trace.length - 1, Math.round(p.stepIndex ?? 0)))
      return { trace, frame: trace[idx], idx, sc: SCENARIOS[scIdx] ?? SCENARIOS[0], algo }
    }

    return {
      actions: [{ id: 'runEnd', label: 'Run to End' }],
      update: (p, dt) => {
        if (dt <= 0) return
        accum += dt
        if (accum >= 0.75) {
          accum = 0
          const { trace, idx } = getFrame(p)
          if (idx < trace.length - 1) p.stepIndex = idx + 1
        }
      },
      step: (p, dir, actionId) => {
        const { trace, idx } = getFrame(p)
        if (actionId === 'runEnd') {
          p.stepIndex = trace.length - 1
          return
        }
        p.stepIndex = Math.max(0, Math.min(trace.length - 1, idx + dir))
      },
      hotspots: [
        {
          id: 'frontier',
          label: 'Frontier Queue',
          x: 600,
          y: 120,
          title: 'Priority Queue / FIFO Frontier',
          body: 'BFS pops oldest discovery (FIFO); Dijkstra pops min g(n); A* pops min f(n) = g(n) + h(n); Prim pops cheapest connecting edge.',
        },
        {
          id: 'trap-edge',
          label: '1-Hop Trap Edge',
          x: 245,
          y: 280,
          title: 'High-Weight Direct Shortcut',
          body: 'Edge S→G has only 1 hop (cost 12). Unweighted BFS grabs it early, while cost-aware Dijkstra takes S→A→B→C→G (cost 5).',
        },
      ],
      renderCanvas: (ctx, p) => {
        const { trace, frame, idx, sc, algo } = getFrame(p)
        const showH = (p.showHeuristics ?? 1) >= 0.5

        ctx.save()
        // Left graph box
        ctx.fillStyle = 'rgba(15, 23, 42, 0.55)'
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)'
        ctx.fillRect(24, 46, 466, 376)
        ctx.strokeRect(24, 46, 466, 376)
        ctx.fillStyle = '#e2e8f0'
        ctx.font = 'bold 11px ui-sans-serif, system-ui, sans-serif'
        ctx.fillText(`${sc.name} — Step ${idx}/${trace.length - 1}`, 28, 36)

        const isFinalEdge = (u: string, v: string) => {
          for (let i = 0; i < frame.finalPath.length - 1; i += 1) {
            const a = frame.finalPath[i]
            const b = frame.finalPath[i + 1]
            if ((a === u && b === v) || (a === v && b === u)) return true
          }
          return false
        }
        const isTreeEdge = (u: string, v: string) =>
          frame.treeEdges.some(([a, b]) => (a === u && b === v) || (a === v && b === u))

        // Edges
        for (const e of sc.edges) {
          const nu = sc.nodes.find((n) => n.id === e.u)!
          const nv = sc.nodes.find((n) => n.id === e.v)!
          const final = isFinalEdge(e.u, e.v)
          const inTree = isTreeEdge(e.u, e.v)

          ctx.strokeStyle = final
            ? PALETTE_CSS.emerald
            : inTree
              ? PALETTE_CSS.cyan
              : 'rgba(148, 163, 184, 0.35)'
          ctx.lineWidth = final ? 4.5 : inTree ? 3 : 1.6
          ctx.beginPath()
          ctx.moveTo(nu.x, nu.y)
          ctx.lineTo(nv.x, nv.y)
          ctx.stroke()

          const mx = (nu.x + nv.x) / 2
          const my = (nu.y + nv.y) / 2
          ctx.fillStyle = '#0f172a'
          ctx.fillRect(mx - 10, my - 9, 20, 18)
          ctx.fillStyle = final ? PALETTE_CSS.emerald : '#fde68a'
          ctx.font = 'bold 11px ui-monospace, monospace'
          ctx.textAlign = 'center'
          ctx.fillText(String(e.w), mx, my + 4)
        }

        // Nodes
        for (const n of sc.nodes) {
          const isCur = frame.current === n.id
          const isFinal = frame.finalPath.includes(n.id)
          const isSettled = frame.settled.includes(n.id)
          const isFront = frame.frontier.includes(n.id)

          ctx.fillStyle = isCur
            ? PALETTE_CSS.amber
            : isFinal
              ? PALETTE_CSS.emerald
              : isSettled
                ? PALETTE_CSS.cyan
                : isFront
                  ? PALETTE_CSS.violet
                  : '#1e293b'
          ctx.strokeStyle = '#f8fafc'
          ctx.lineWidth = isCur ? 3 : 1.8
          ctx.beginPath()
          ctx.arc(n.x, n.y, 19, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()

          ctx.fillStyle = isCur || isFinal || isSettled ? '#0f172a' : '#f8fafc'
          ctx.font = 'bold 13px ui-monospace, monospace'
          ctx.textAlign = 'center'
          ctx.fillText(n.id, n.x, n.y + 4)

          if (showH) {
            const g = frame.dist[n.id]
            const h = algo === 2 ? heuristic(sc.nodes, n.id, sc.goal) : null
            const label =
              g === Infinity
                ? '∞'
                : h !== null
                  ? `g=${g} h=${h}`
                  : algo === 0
                    ? `hop=${g}`
                    : `cost=${g}`
            ctx.fillStyle = '#cbd5e1'
            ctx.font = '10px ui-monospace, monospace'
            ctx.fillText(label, n.x, n.y - 24)
          }
        }

        // Right panel: Queue & Step Log
        const px = 506
        const py = 46
        const pw = 192
        const ph = 376
        ctx.fillStyle = 'rgba(15, 23, 42, 0.55)'
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)'
        ctx.fillRect(px, py, pw, ph)
        ctx.strokeRect(px, py, pw, ph)

        ctx.fillStyle = '#e2e8f0'
        ctx.textAlign = 'left'
        ctx.font = 'bold 11px ui-sans-serif, system-ui, sans-serif'
        ctx.fillText('Frontier Queue & State', px + 10, py - 8)

        ctx.fillStyle = PALETTE_CSS.violet
        ctx.font = '10px ui-monospace, monospace'
        ctx.fillText('Frontier:', px + 12, py + 24)
        ctx.fillStyle = '#f8fafc'
        ctx.fillText(frame.frontier.length > 0 ? frame.frontier.join(', ') : '(empty)', px + 12, py + 42)

        ctx.fillStyle = PALETTE_CSS.cyan
        ctx.fillText('Settled:', px + 12, py + 72)
        ctx.fillStyle = '#f8fafc'
        ctx.fillText(frame.settled.join(', ') || '—', px + 12, py + 90)

        ctx.fillStyle = PALETTE_CSS.emerald
        ctx.fillText(algo === 3 ? 'MST Edges:' : 'Path / Note:', px + 12, py + 122)
        ctx.fillStyle = '#cbd5e1'
        const words = frame.note.split(' ')
        let line = ''
        let ly = py + 142
        for (const w of words) {
          if ((line + ' ' + w).length > 26) {
            ctx.fillText(line, px + 12, ly)
            ly += 16
            line = w
          } else {
            line = line ? `${line} ${w}` : w
          }
        }
        if (line) ctx.fillText(line, px + 12, ly)

        ctx.restore()
      },
      readouts: (p) => {
        const { trace, frame, idx, sc } = getFrame(p)
        return [
          { label: 'Step', value: `${idx} / ${trace.length - 1}` },
          { label: 'Settled Nodes', value: `${frame.settled.length} / ${sc.nodes.length}` },
          {
            label: Math.round(p.algo ?? 1) === 3 ? 'MST Total Weight' : 'Path Weight',
            value: frame.finalCost > 0 ? `${frame.finalCost}` : 'In progress',
          },
          { label: 'Frontier Size', value: `${frame.frontier.length}` },
        ]
      },
      metrics: (p) => {
        const { frame } = getFrame(p)
        return {
          settledCount: frame.settled.length,
          finalCost: frame.finalCost,
        }
      },
    }
  },
}

export default function GraphPathfinding2D() {
  return <Interactive2DViewer model={graphPathfinding2dModel} />
}
