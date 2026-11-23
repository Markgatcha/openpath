import { useId } from 'react'
import type { FigureGeometry, ParametricDiagram } from '@shared/figure'
import { cn } from '@/lib/utils'

export interface FigureInteractiveRegion {
  id: string
  label: string
  /** Coordinate inside logical viewBox (`0..100` classic, `0..420 × 0..280` parametric). */
  x: number
  y: number
  hint?: string
}

/**
 * Derive sensible default clickable/inspectable regions from any `FigureGeometry`.
 * Callers can override with custom `interactiveRegions` on `<FigureCanvas>`.
 */
export function getFigureInteractiveRegions(geometry: FigureGeometry): FigureInteractiveRegion[] {
  if (!geometry.diagram) {
    const out: FigureInteractiveRegion[] = []
    if (geometry.circle) {
      const c = geometry.circle
      out.push(
        { id: 'circle-center', label: 'Center', x: c.cx, y: c.cy },
        { id: 'circle-radius', label: c.label || 'r', x: c.cx + c.r / 2, y: c.cy },
      )
    }
    geometry.vertices.forEach((v, idx) => {
      out.push({ id: `vertex-${idx}`, label: `Vertex ${v.name}`, x: v.x, y: v.y })
    })
    geometry.edges.forEach((edge, idx) => {
      if (!edge.label) return
      const from = geometry.vertices[edge.from]
      const to = geometry.vertices[edge.to]
      if (!from || !to) return
      out.push({
        id: `edge-${idx}`,
        label: edge.label === '?' ? 'Unknown side' : edge.label,
        x: (from.x + to.x) / 2,
        y: (from.y + to.y) / 2,
      })
    })
    return out
  }

  switch (geometry.diagram.kind) {
    case 'supply-demand':
      return [
        { id: 'equilibrium', label: 'Equilibrium E*', x: 210, y: 145 },
        { id: 'demand', label: 'Demand D', x: 135, y: 95 },
        { id: 'supply', label: 'Supply S', x: 285, y: 95 },
        { id: 'wedge', label: 'Surplus / Wedge', x: 180, y: 155 },
      ]
    case 'normal-curve':
      return [
        { id: 'mean', label: 'Mean μ', x: 210, y: 120 },
        { id: 'sd-left', label: 'μ − σ', x: 165, y: 158 },
        { id: 'tail', label: 'Z tail', x: 295, y: 195 },
        { id: 'area', label: 'Shaded probability', x: 210, y: 200 },
      ]
    case 'unit-circle':
      return [
        { id: 'origin', label: 'Origin', x: 210, y: 140 },
        { id: 'terminal', label: 'Terminal point (cos, sin)', x: 290, y: 90 },
        { id: 'cos-leg', label: 'cos θ projection', x: 250, y: 145 },
        { id: 'sin-leg', label: 'sin θ height', x: 290, y: 115 },
      ]
    case 'series-parallel-circuit':
      return [
        { id: 'source', label: 'Voltage source V', x: 75, y: 140 },
        { id: 'r1', label: 'Resistor R₁', x: 210, y: 82 },
        { id: 'r2', label: 'Resistor R₂', x: 210, y: 198 },
        { id: 'node', label: 'Junction / Load', x: 335, y: 140 },
      ]
    case 'inclined-plane':
      return [
        { id: 'mass', label: 'Sliding block', x: 210, y: 145 },
        { id: 'normal', label: 'Normal force N', x: 185, y: 95 },
        { id: 'gravity', label: 'Gravity mg', x: 210, y: 205 },
        { id: 'angle', label: 'Incline θ', x: 105, y: 225 },
      ]
    case 'vector-2d':
      return [
        { id: 'tail', label: 'Vector tail', x: 170, y: 185 },
        { id: 'tip', label: 'Resultant tip', x: 280, y: 95 },
        { id: 'dx', label: 'Δx component', x: 225, y: 185 },
        { id: 'dy', label: 'Δy component', x: 280, y: 140 },
      ]
    case 'parabola-vertex':
      return [
        { id: 'vertex', label: 'Vertex (h, k)', x: 210, y: 185 },
        { id: 'axis', label: 'Axis x = h', x: 210, y: 95 },
        { id: 'arm', label: 'Quadratic arm', x: 285, y: 105 },
      ]
    case 'coordinate-line':
      return [
        { id: 'p1', label: 'Point A', x: 115, y: 140 },
        { id: 'mid', label: 'Midpoint', x: 210, y: 140 },
        { id: 'p2', label: 'Point B', x: 305, y: 140 },
      ]
  }
}

export interface FigureCanvasProps {
  geometry: FigureGeometry
  className?: string
  size?: number
  interactiveRegions?: FigureInteractiveRegion[]
  onRegionSelect?: (region: FigureInteractiveRegion) => void
  selectedRegionId?: string | null
  hideLabels?: boolean
}

/**
 * Renders figure-question geometry and STEM parametric diagrams as clean SVG.
 * The asked quantity is already labeled "?" by the shared engine, so this
 * component never learns or leaks the answer key. Optionally renders
 * accessible clickable hotspot regions over the diagram.
 */
export function FigureCanvas({
  geometry,
  className,
  size = 260,
  interactiveRegions,
  onRegionSelect,
  selectedRegionId,
  hideLabels,
}: FigureCanvasProps) {
  const isInteractive = Boolean(interactiveRegions || onRegionSelect)

  if (geometry.diagram) {
    const svg = (
      <ParametricDiagramSvg
        diagram={geometry.diagram}
        className={isInteractive ? undefined : className}
        width={Math.round(size * 1.5)}
      />
    )
    if (!isInteractive) return svg
    const regions = interactiveRegions ?? getFigureInteractiveRegions(geometry)
    return (
      <FigureRegionOverlay
        className={className}
        regions={regions}
        selectedRegionId={selectedRegionId}
        hideLabels={hideLabels}
        onRegionSelect={onRegionSelect}
        vbWidth={420}
        vbHeight={280}
      >
        {svg}
      </FigureRegionOverlay>
    )
  }

  const { vertices, edges, angles, rightAngleAt, circle, radiusLine } = geometry

  const classicSvg = (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn('max-w-full h-auto', isInteractive ? undefined : className)}
      role="img"
      aria-label="Geometry figure"
    >
      {/* Circle */}
      {circle && (
        <>
          <circle
            cx={circle.cx}
            cy={circle.cy}
            r={circle.r}
            fill="none"
            strokeWidth={1.4}
            className="stroke-slate-500 dark:stroke-slate-300"
          />
          <line
            x1={circle.cx}
            y1={circle.cy}
            x2={circle.cx + circle.r}
            y2={circle.cy}
            strokeWidth={1.2}
            className="stroke-slate-400 dark:stroke-slate-400"
          />
          <text
            x={circle.cx + circle.r / 2}
            y={circle.cy - 3}
            textAnchor="middle"
            fontSize={6}
            className="fill-slate-600 font-semibold dark:fill-slate-200"
          >
            {circle.label}
          </text>
          {circle.label === '?' && (
            <text
              x={circle.cx}
              y={circle.cy + circle.r + 8}
              textAnchor="middle"
              fontSize={5}
              className="fill-slate-400"
            >
              r
            </text>
          )}
        </>
      )}

      {/* Polygon edges */}
      {edges.map((edge, index) => {
        const from = vertices[edge.from]
        const to = vertices[edge.to]
        if (!from || !to) return null
        const mx = (from.x + to.x) / 2
        const my = (from.y + to.y) / 2
        const dx = to.x - from.x
        const dy = to.y - from.y
        const len = Math.hypot(dx, dy) || 1
        const nx = -dy / len
        const ny = dx / len
        const offset = edge.label && index === 4 ? 7 : 4
        return (
          <g key={`edge-${index}`}>
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              strokeWidth={1.4}
              className="stroke-slate-500 dark:stroke-slate-300"
            />
            {edge.label && (
              <g>
                <rect
                  x={mx + nx * offset - 5}
                  y={my + ny * offset - 3.6}
                  width={10}
                  height={7.2}
                  rx={2}
                  className="fill-slate-50 dark:fill-ink-900"
                />
                <text
                  x={mx + nx * offset}
                  y={my + ny * offset + 2}
                  textAnchor="middle"
                  fontSize={5.4}
                  fontWeight={700}
                  className={
                    edge.label === '?'
                      ? 'fill-brand-500'
                      : 'fill-slate-600 dark:fill-slate-200'
                  }
                >
                  {edge.label}
                </text>
              </g>
            )}
          </g>
        )
      })}

      {/* Right-angle marker */}
      {rightAngleAt !== null && vertices[rightAngleAt] && (
        <RightAngleMark
          vertex={vertices[rightAngleAt]}
          neighbors={edges
            .map((edge) =>
              edge.from === rightAngleAt
                ? vertices[edge.to]
                : edge.to === rightAngleAt
                  ? vertices[edge.from]
                  : null,
            )
            .filter((point): point is { name: string; x: number; y: number } => point !== null)}
        />
      )}

      {/* Vertices + angle labels */}
      {vertices.map((vertex, index) => {
        const angle = angles.find((entry) => entry.vertex === index)
        const others = vertices.filter((_, i) => i !== index)
        const cx = others.reduce((sum, p) => sum + p.x, 0) / (others.length || 1)
        const cy = others.reduce((sum, p) => sum + p.y, 0) / (others.length || 1)
        const vx = vertex.x + (cx - vertex.x) * 0.28
        const vy = vertex.y + (cy - vertex.y) * 0.28
        return (
          <g key={`vertex-${index}`}>
            <circle
              cx={vertex.x}
              cy={vertex.y}
              r={1.3}
              className="fill-slate-600 dark:fill-slate-300"
            />
            <text
              x={vertex.x}
              y={vertex.y - 3.5}
              textAnchor="middle"
              fontSize={5}
              fontWeight={700}
              className="fill-slate-500 dark:fill-slate-400"
            >
              {vertex.name}
            </text>
            {angle?.label && (
              <text
                x={vx}
                y={vy + 1.5}
                textAnchor="middle"
                fontSize={4.8}
                fontWeight={700}
                className={
                  angle.label === '?'
                    ? 'fill-brand-500'
                    : 'fill-brand-600 dark:fill-brand-300'
                }
              >
                {angle.label}°
              </text>
            )}
          </g>
        )
      })}

      {/* Radius line label (circles) */}
      {radiusLine && circle && (
        <text
          x={circle.cx + circle.r / 2}
          y={circle.cy + 5}
          textAnchor="middle"
          fontSize={5}
          className="fill-slate-500 dark:fill-slate-300"
        >
          r
        </text>
      )}
    </svg>
  )

  if (!isInteractive) return classicSvg
  const regions = interactiveRegions ?? getFigureInteractiveRegions(geometry)
  return (
    <FigureRegionOverlay
      className={className}
      regions={regions}
      selectedRegionId={selectedRegionId}
      hideLabels={hideLabels}
      onRegionSelect={onRegionSelect}
      vbWidth={100}
      vbHeight={100}
    >
      {classicSvg}
    </FigureRegionOverlay>
  )
}

function FigureRegionOverlay({
  children,
  className,
  regions,
  selectedRegionId,
  hideLabels,
  onRegionSelect,
  vbWidth,
  vbHeight,
}: {
  children: React.ReactNode
  className?: string
  regions: FigureInteractiveRegion[]
  selectedRegionId?: string | null
  hideLabels?: boolean
  onRegionSelect?: (region: FigureInteractiveRegion) => void
  vbWidth: number
  vbHeight: number
}) {
  return (
    <div
      className={cn('relative inline-block max-w-full select-none', className)}
      onKeyDown={(event) => {
        if (event.key >= '1' && event.key <= '9') {
          const picked = regions[Number(event.key) - 1]
          if (picked && onRegionSelect) {
            event.preventDefault()
            onRegionSelect(picked)
          }
        }
      }}
    >
      {children}
      <div className="pointer-events-none absolute inset-0">
        {regions.map((region, idx) => {
          const selected = selectedRegionId === region.id
          return (
            <button
              key={region.id}
              type="button"
              onClick={() => onRegionSelect?.(region)}
              aria-label={hideLabels ? `Inspect region ${idx + 1}` : `Inspect ${region.label}`}
              aria-pressed={selected}
              title={hideLabels ? `Region ${idx + 1}` : region.hint ?? region.label}
              style={{
                left: `${(region.x / vbWidth) * 100}%`,
                top: `${(region.y / vbHeight) * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className={cn(
                'pointer-events-auto absolute flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-bold shadow-md backdrop-blur transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',
                selected
                  ? 'border-cyan-400 bg-cyan-400 text-ink-950 scale-110'
                  : 'border-slate-300 bg-white/90 text-slate-800 hover:bg-brand-50 dark:border-white/25 dark:bg-ink-900/90 dark:text-white dark:hover:bg-ink-700',
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
              {hideLabels ? idx + 1 : region.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function RightAngleMark({
  vertex,
  neighbors,
}: {
  vertex: { x: number; y: number }
  neighbors: { x: number; y: number }[]
}) {
  if (neighbors.length < 2) return null
  const size = 4.5
  const dir1 = unit(neighbors[0], vertex)
  const dir2 = unit(neighbors[1], vertex)
  const p1 = { x: vertex.x + dir1.x * size, y: vertex.y + dir1.y * size }
  const p2 = { x: vertex.x + dir2.x * size, y: vertex.y + dir2.y * size }
  const corner = { x: p1.x + dir2.x * size, y: p1.y + dir2.y * size }
  return (
    <polygon
      points={`${p1.x},${p1.y} ${corner.x},${corner.y} ${p2.x},${p2.y}`}
      fill="none"
      strokeWidth={0.9}
      className="stroke-slate-400 dark:stroke-slate-400"
    />
  )
}

function unit(
  from: { x: number; y: number },
  to: { x: number; y: number },
): { x: number; y: number } {
  const dx = from.x - to.x
  const dy = from.y - to.y
  const len = Math.hypot(dx, dy) || 1
  return { x: dx / len, y: dy / len }
}

// ── Responsive 420×280 STEM Parametric Diagrams ─────────────────

function TargetBadge({ label, x = 408, y = 14 }: { label: string; x?: number; y?: number }) {
  const width = Math.max(92, label.length * 7.2 + 20)
  return (
    <g transform={`translate(${x - width}, ${y})`}>
      <rect
        x={0}
        y={0}
        width={width}
        height={26}
        rx={8}
        className="fill-amber-500/15 stroke-amber-500/60 dark:fill-amber-400/15 dark:stroke-amber-400/60"
        strokeWidth={1.2}
      />
      <text
        x={width / 2}
        y={17}
        textAnchor="middle"
        fontSize={12}
        fontWeight={800}
        className="fill-amber-700 font-mono dark:fill-amber-300"
      >
        {label}
      </text>
    </g>
  )
}

function ParametricDiagramSvg({
  diagram,
  className,
  width,
}: {
  diagram: ParametricDiagram
  className?: string
  width: number
}) {
  const uid = useId().replace(/:/g, '')
  const height = Math.round((width * 280) / 420)

  return (
    <svg
      viewBox="0 0 420 280"
      width={width}
      height={height}
      className={cn(
        'max-w-full h-auto rounded-xl border border-slate-200/80 bg-slate-50/70 dark:border-white/10 dark:bg-ink-900/70',
        className,
      )}
      role="img"
      aria-label={`${diagram.kind} parametric diagram`}
    >
      <defs>
        <marker
          id={`arrow-brand-${uid}`}
          viewBox="0 0 10 10"
          refX={8}
          refY={5}
          markerWidth={6}
          markerHeight={6}
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" className="fill-brand-500 dark:fill-brand-400" />
        </marker>
        <marker
          id={`arrow-cyan-${uid}`}
          viewBox="0 0 10 10"
          refX={8}
          refY={5}
          markerWidth={6}
          markerHeight={6}
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" className="fill-cyan-600 dark:fill-cyan-400" />
        </marker>
        <marker
          id={`arrow-emerald-${uid}`}
          viewBox="0 0 10 10"
          refX={8}
          refY={5}
          markerWidth={6}
          markerHeight={6}
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" className="fill-emerald-600 dark:fill-emerald-400" />
        </marker>
        <marker
          id={`arrow-rose-${uid}`}
          viewBox="0 0 10 10"
          refX={8}
          refY={5}
          markerWidth={6}
          markerHeight={6}
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" className="fill-rose-600 dark:fill-rose-400" />
        </marker>
        <marker
          id={`arrow-amber-${uid}`}
          viewBox="0 0 10 10"
          refX={8}
          refY={5}
          markerWidth={6}
          markerHeight={6}
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" className="fill-amber-600 dark:fill-amber-400" />
        </marker>
      </defs>

      {diagram.kind === 'coordinate-line' && <CoordinateLineBody d={diagram} />}
      {diagram.kind === 'parabola-vertex' && <ParabolaVertexBody d={diagram} />}
      {diagram.kind === 'unit-circle' && <UnitCircleBody d={diagram} />}
      {diagram.kind === 'vector-2d' && <Vector2dBody d={diagram} uid={uid} />}
      {diagram.kind === 'inclined-plane' && <InclinedPlaneBody d={diagram} uid={uid} />}
      {diagram.kind === 'series-parallel-circuit' && <CircuitBody d={diagram} uid={uid} />}
      {diagram.kind === 'supply-demand' && <SupplyDemandBody d={diagram} />}
      {diagram.kind === 'normal-curve' && <NormalCurveBody d={diagram} />}

      <TargetBadge label={diagram.targetLabel} />
    </svg>
  )
}

function CartesianGrid({
  minX,
  maxX,
  minY,
  maxY,
}: {
  minX: number
  maxX: number
  minY: number
  maxY: number
}) {
  const padL = 44
  const padR = 26
  const padT = 36
  const padB = 32
  const w = 420 - padL - padR
  const h = 280 - padT - padB
  const sx = (x: number) => padL + ((x - minX) / (maxX - minX || 1)) * w
  const sy = (y: number) => padT + h - ((y - minY) / (maxY - minY || 1)) * h

  const zeroX = minX <= 0 && maxX >= 0 ? sx(0) : padL
  const zeroY = minY <= 0 && maxY >= 0 ? sy(0) : padT + h

  const ticks = 5
  const xTicks = Array.from({ length: ticks + 1 }, (_, i) => minX + ((maxX - minX) * i) / ticks)
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => minY + ((maxY - minY) * i) / ticks)

  return (
    <g>
      {xTicks.map((tx, idx) => (
        <line
          key={`gx-${idx}`}
          x1={sx(tx)}
          y1={padT}
          x2={sx(tx)}
          y2={padT + h}
          strokeWidth={0.8}
          className="stroke-slate-200 dark:stroke-white/10"
        />
      ))}
      {yTicks.map((ty, idx) => (
        <line
          key={`gy-${idx}`}
          x1={padL}
          y1={sy(ty)}
          x2={padL + w}
          y2={sy(ty)}
          strokeWidth={0.8}
          className="stroke-slate-200 dark:stroke-white/10"
        />
      ))}
      <line
        x1={padL}
        y1={zeroY}
        x2={padL + w}
        y2={zeroY}
        strokeWidth={1.5}
        className="stroke-slate-400 dark:stroke-slate-500"
      />
      <line
        x1={zeroX}
        y1={padT}
        x2={zeroX}
        y2={padT + h}
        strokeWidth={1.5}
        className="stroke-slate-400 dark:stroke-slate-500"
      />
      <text
        x={padL + w - 4}
        y={zeroY - 6}
        textAnchor="end"
        fontSize={11}
        fontWeight={700}
        className="fill-slate-500 dark:fill-slate-400"
      >
        x
      </text>
      <text
        x={zeroX + 6}
        y={padT + 11}
        fontSize={11}
        fontWeight={700}
        className="fill-slate-500 dark:fill-slate-400"
      >
        y
      </text>
    </g>
  )
}

function CoordinateLineBody({
  d,
}: {
  d: Extract<ParametricDiagram, { kind: 'coordinate-line' }>
}) {
  const span = Math.max(
    6,
    Math.abs(d.x1) * 1.4,
    Math.abs(d.x2) * 1.4,
    Math.abs(d.y1) * 1.4,
    Math.abs(d.y2) * 1.4,
  )
  const minX = -span
  const maxX = span
  const minY = -span
  const maxY = span
  const sx = (x: number) => 44 + ((x - minX) / (maxX - minX)) * 350
  const sy = (y: number) => 36 + 212 - ((y - minY) / (maxY - minY)) * 212

  // Extend infinite line across viewport
  let lx1 = d.x1
  let ly1 = d.y1
  let lx2 = d.x2
  let ly2 = d.y2
  if (d.x1 !== d.x2) {
    const m = (d.y2 - d.y1) / (d.x2 - d.x1)
    const b = d.y1 - m * d.x1
    lx1 = minX
    ly1 = m * minX + b
    lx2 = maxX
    ly2 = m * maxX + b
  } else {
    ly1 = minY
    ly2 = maxY
  }

  return (
    <g>
      <CartesianGrid minX={minX} maxX={maxX} minY={minY} maxY={maxY} />
      {/* Dashed rise/run guide */}
      <polyline
        points={`${sx(d.x1)},${sy(d.y1)} ${sx(d.x2)},${sy(d.y1)} ${sx(d.x2)},${sy(d.y2)}`}
        fill="none"
        strokeDasharray="4 4"
        strokeWidth={1.3}
        className="stroke-amber-500/80 dark:stroke-amber-400/70"
      />
      {/* Extended line */}
      <line
        x1={sx(lx1)}
        y1={sy(ly1)}
        x2={sx(lx2)}
        y2={sy(ly2)}
        strokeWidth={2.4}
        className="stroke-brand-500 dark:stroke-brand-400"
      />
      {/* P1 & P2 */}
      <circle cx={sx(d.x1)} cy={sy(d.y1)} r={5} className="fill-brand-600 dark:fill-brand-300" />
      <circle cx={sx(d.x2)} cy={sy(d.y2)} r={5} className="fill-cyan-600 dark:fill-cyan-300" />
      <text
        x={sx(d.x1) + 8}
        y={sy(d.y1) - 8}
        fontSize={12}
        fontWeight={700}
        className="fill-slate-800 font-mono dark:fill-slate-100"
      >
        P₁({d.x1}, {d.y1})
      </text>
      <text
        x={sx(d.x2) + 8}
        y={sy(d.y2) + 16}
        fontSize={12}
        fontWeight={700}
        className="fill-slate-800 font-mono dark:fill-slate-100"
      >
        P₂({d.x2}, {d.y2})
      </text>
    </g>
  )
}

function ParabolaVertexBody({
  d,
}: {
  d: Extract<ParametricDiagram, { kind: 'parabola-vertex' }>
}) {
  const vx = -d.b / (2 * d.a)
  const vy = d.a * vx * vx + d.b * vx + d.c
  const halfSpanX = Math.max(5, Math.abs(vx) + 5)
  const minX = vx - halfSpanX
  const maxX = vx + halfSpanX
  const edgeY = d.a * (vx + halfSpanX * 0.75) ** 2 + d.b * (vx + halfSpanX * 0.75) + d.c
  const yLow = Math.min(vy, edgeY, d.c, -4) - 3
  const yHigh = Math.max(vy, edgeY, d.c, 4) + 3
  const sx = (x: number) => 44 + ((x - minX) / (maxX - minX)) * 350
  const sy = (y: number) => 36 + 212 - ((y - yLow) / (yHigh - yLow || 1)) * 212

  const pts: string[] = []
  const steps = 64
  for (let i = 0; i <= steps; i += 1) {
    const x = minX + ((maxX - minX) * i) / steps
    const y = d.a * x * x + d.b * x + d.c
    if (y >= yLow - 20 && y <= yHigh + 20) {
      pts.push(`${sx(x).toFixed(1)},${Math.max(20, Math.min(264, sy(y))).toFixed(1)}`)
    }
  }

  return (
    <g>
      <CartesianGrid minX={minX} maxX={maxX} minY={yLow} maxY={yHigh} />
      {/* Axis of symmetry */}
      <line
        x1={sx(vx)}
        y1={36}
        x2={sx(vx)}
        y2={248}
        strokeDasharray="4 4"
        strokeWidth={1.2}
        className="stroke-amber-500/75"
      />
      <polyline
        points={pts.join(' ')}
        fill="none"
        strokeWidth={2.5}
        className="stroke-brand-500 dark:stroke-brand-400"
      />
      {/* Vertex marker (labeled ? when asked) */}
      <circle cx={sx(vx)} cy={Math.max(36, Math.min(248, sy(vy)))} r={5.5} className="fill-amber-500" />
      <text
        x={20}
        y={28}
        fontSize={12.5}
        fontWeight={800}
        className="fill-slate-800 font-mono dark:fill-slate-100"
      >
        {d.equationLabel}
      </text>
      <text
        x={sx(vx) + 8}
        y={Math.max(50, Math.min(240, sy(vy) + (d.a > 0 ? 15 : -8)))}
        fontSize={11.5}
        fontWeight={700}
        className="fill-amber-600 font-mono dark:fill-amber-300"
      >
        V(?, ?)
      </text>
    </g>
  )
}

function UnitCircleBody({
  d,
}: {
  d: Extract<ParametricDiagram, { kind: 'unit-circle' }>
}) {
  const cx = 195
  const cy = 148
  const r = 92
  const theta = (d.angleDeg * Math.PI) / 180
  const px = cx + r * Math.cos(theta)
  const py = cy - r * Math.sin(theta)

  // Angle arc
  const arcR = 26
  const steps = 28
  const arcPts: string[] = []
  for (let i = 0; i <= steps; i += 1) {
    const t = (theta * i) / steps
    arcPts.push(`${(cx + arcR * Math.cos(t)).toFixed(1)},${(cy - arcR * Math.sin(t)).toFixed(1)}`)
  }

  return (
    <g>
      {/* Axes */}
      <line x1={cx - 122} y1={cy} x2={cx + 122} y2={cy} strokeWidth={1.4} className="stroke-slate-400 dark:stroke-slate-500" />
      <line x1={cx} y1={cy - 116} x2={cx} y2={cy + 116} strokeWidth={1.4} className="stroke-slate-400 dark:stroke-slate-500" />
      {/* Unit circle */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        strokeWidth={2}
        className="stroke-slate-600 dark:stroke-slate-300"
      />
      {/* Cosine (horizontal) & Sine (vertical) projections */}
      <line
        x1={cx}
        y1={cy}
        x2={px}
        y2={cy}
        strokeWidth={2.5}
        className="stroke-cyan-500 dark:stroke-cyan-400"
      />
      <line
        x1={px}
        y1={cy}
        x2={px}
        y2={py}
        strokeWidth={2.5}
        className="stroke-emerald-500 dark:stroke-emerald-400"
      />
      {/* Terminal ray */}
      <line
        x1={cx}
        y1={cy}
        x2={px}
        y2={py}
        strokeWidth={2.5}
        className="stroke-brand-500 dark:stroke-brand-400"
      />
      <polyline
        points={arcPts.join(' ')}
        fill="none"
        strokeWidth={1.8}
        className="stroke-amber-500"
      />
      <circle cx={px} cy={py} r={5.5} className="fill-brand-500 dark:fill-brand-300" />
      <text x={cx + r + 8} y={cy + 14} fontSize={11} className="fill-slate-500 font-mono dark:fill-slate-400">
        (1, 0)
      </text>
      <text x={cx + 6} y={cy - r - 6} fontSize={11} className="fill-slate-500 font-mono dark:fill-slate-400">
        (0, 1)
      </text>
      <text x={20} y={28} fontSize={13} fontWeight={800} className="fill-slate-800 font-mono dark:fill-slate-100">
        θ = {d.angleDeg}° · r = 1
      </text>
      <text x={20} y={262} fontSize={11} fontWeight={600} className="fill-cyan-600 font-mono dark:fill-cyan-300">
        cos θ (x-leg)
      </text>
      <text x={118} y={262} fontSize={11} fontWeight={600} className="fill-emerald-600 font-mono dark:fill-emerald-300">
        sin θ (y-leg)
      </text>
    </g>
  )
}

function Vector2dBody({
  d,
  uid,
}: {
  d: Extract<ParametricDiagram, { kind: 'vector-2d' }>
  uid: string
}) {
  const rx = d.ux + d.vx
  const ry = d.uy + d.vy
  const bound = Math.max(
    6,
    Math.abs(d.ux) * 1.35,
    Math.abs(d.uy) * 1.35,
    Math.abs(d.vx) * 1.35,
    Math.abs(d.vy) * 1.35,
    Math.abs(rx) * 1.25,
    Math.abs(ry) * 1.25,
  )
  const sx = (x: number) => 44 + ((x + bound) / (2 * bound)) * 350
  const sy = (y: number) => 36 + 212 - ((y + bound) / (2 * bound)) * 212

  return (
    <g>
      <CartesianGrid minX={-bound} maxX={bound} minY={-bound} maxY={bound} />
      {/* Parallelogram tip-to-tail guides */}
      <line
        x1={sx(d.ux)}
        y1={sy(d.uy)}
        x2={sx(rx)}
        y2={sy(ry)}
        strokeDasharray="4 4"
        strokeWidth={1.2}
        className="stroke-slate-400 dark:stroke-slate-500"
      />
      <line
        x1={sx(d.vx)}
        y1={sy(d.vy)}
        x2={sx(rx)}
        y2={sy(ry)}
        strokeDasharray="4 4"
        strokeWidth={1.2}
        className="stroke-slate-400 dark:stroke-slate-500"
      />
      {/* Vector u */}
      <line
        x1={sx(0)}
        y1={sy(0)}
        x2={sx(d.ux)}
        y2={sy(d.uy)}
        strokeWidth={2.6}
        markerEnd={`url(#arrow-cyan-${uid})`}
        className="stroke-cyan-600 dark:stroke-cyan-400"
      />
      {/* Vector v */}
      <line
        x1={sx(0)}
        y1={sy(0)}
        x2={sx(d.vx)}
        y2={sy(d.vy)}
        strokeWidth={2.6}
        markerEnd={`url(#arrow-emerald-${uid})`}
        className="stroke-emerald-600 dark:stroke-emerald-400"
      />
      {/* Resultant u + v (unlabeled magnitude) */}
      <line
        x1={sx(0)}
        y1={sy(0)}
        x2={sx(rx)}
        y2={sy(ry)}
        strokeWidth={2.2}
        strokeDasharray="6 3"
        markerEnd={`url(#arrow-amber-${uid})`}
        className="stroke-amber-500 dark:stroke-amber-400"
      />
      <text x={20} y={26} fontSize={12} fontWeight={800} className="fill-cyan-700 font-mono dark:fill-cyan-300">
        u = ⟨{d.ux}, {d.uy}⟩
      </text>
      <text x={148} y={26} fontSize={12} fontWeight={800} className="fill-emerald-700 font-mono dark:fill-emerald-300">
        v = ⟨{d.vx}, {d.vy}⟩
      </text>
    </g>
  )
}

function InclinedPlaneBody({
  d,
  uid,
}: {
  d: Extract<ParametricDiagram, { kind: 'inclined-plane' }>
  uid: string
}) {
  const theta = (Math.min(62, Math.max(15, d.angle)) * Math.PI) / 180
  const baseX = 56
  const baseY = 242
  const rampW = 260
  const rampH = Math.min(176, rampW * Math.tan(theta))
  const topX = baseX + rampW
  const topY = baseY - rampH

  // Place block 52% up the incline
  const t = 0.52
  const bx = baseX + (topX - baseX) * t
  const by = baseY + (topY - baseY) * t
  const ux = (topX - baseX) / Math.hypot(topX - baseX, topY - baseY)
  const uy = (topY - baseY) / Math.hypot(topX - baseX, topY - baseY)
  // Outward normal (up-left in SVG coords where y grows down)
  const nx = uy
  const ny = -ux
  const cx = bx + nx * 20
  const cy = by + ny * 20
  const degRot = (Math.atan2(topY - baseY, topX - baseX) * 180) / Math.PI

  return (
    <g>
      {/* Ramp wedge */}
      <polygon
        points={`${baseX},${baseY} ${topX},${baseY} ${topX},${topY}`}
        className="fill-slate-200/80 stroke-slate-500 dark:fill-white/5 dark:stroke-slate-400"
        strokeWidth={2}
      />
      {/* Angle label */}
      <text
        x={baseX + 44}
        y={baseY - 8}
        fontSize={12}
        fontWeight={800}
        className="fill-brand-600 font-mono dark:fill-brand-300"
      >
        θ = {d.angle}°
      </text>
      {/* Block */}
      <g transform={`translate(${cx}, ${cy}) rotate(${degRot})`}>
        <rect
          x={-24}
          y={-18}
          width={48}
          height={36}
          rx={5}
          className="fill-brand-500/25 stroke-brand-500 dark:fill-brand-400/25 dark:stroke-brand-300"
          strokeWidth={2}
        />
        <text
          x={0}
          y={5}
          textAnchor="middle"
          fontSize={11.5}
          fontWeight={800}
          className="fill-slate-900 font-mono dark:fill-white"
        >
          {d.mass}kg
        </text>
      </g>
      {/* Force vectors from center of mass */}
      {/* Gravity straight down */}
      <line
        x1={cx}
        y1={cy}
        x2={cx}
        y2={cy + 62}
        strokeWidth={2.4}
        markerEnd={`url(#arrow-rose-${uid})`}
        className="stroke-rose-500"
      />
      <text x={cx + 6} y={cy + 60} fontSize={11} fontWeight={700} className="fill-rose-600 font-mono dark:fill-rose-300">
        mg
      </text>
      {/* Normal force perpendicular to ramp */}
      <line
        x1={cx}
        y1={cy}
        x2={cx + nx * 56}
        y2={cy + ny * 56}
        strokeWidth={2.4}
        markerEnd={`url(#arrow-cyan-${uid})`}
        className="stroke-cyan-500"
      />
      <text
        x={cx + nx * 62 - 12}
        y={cy + ny * 62}
        fontSize={11}
        fontWeight={700}
        className="fill-cyan-600 font-mono dark:fill-cyan-300"
      >
        F_N
      </text>
      {/* Friction up-slope */}
      {d.mu > 0 && (
        <>
          <line
            x1={cx}
            y1={cy}
            x2={cx + ux * 46}
            y2={cy + uy * 46}
            strokeWidth={2.2}
            markerEnd={`url(#arrow-amber-${uid})`}
            className="stroke-amber-500"
          />
          <text
            x={cx + ux * 52}
            y={cy + uy * 52 - 4}
            fontSize={11}
            fontWeight={700}
            className="fill-amber-600 font-mono dark:fill-amber-300"
          >
            f_k
          </text>
        </>
      )}
      <text x={20} y={28} fontSize={12} fontWeight={800} className="fill-slate-700 font-mono dark:fill-slate-200">
        m = {d.mass} kg · μ = {d.mu} · g = 9.8 m/s²
      </text>
    </g>
  )
}

function ResistorSymbol({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x={-26} y={-10} width={52} height={20} className="fill-slate-50 dark:fill-ink-900" />
      <polyline
        points="-26,0 -20,-8 -12,8 -4,-8 4,8 12,-8 20,8 26,0"
        fill="none"
        strokeWidth={2.2}
        strokeLinejoin="round"
        className="stroke-brand-600 dark:stroke-brand-300"
      />
      <text
        x={0}
        y={-15}
        textAnchor="middle"
        fontSize={11.5}
        fontWeight={800}
        className="fill-slate-800 font-mono dark:fill-slate-100"
      >
        {label}
      </text>
    </g>
  )
}

function CircuitBody({
  d,
  uid,
}: {
  d: Extract<ParametricDiagram, { kind: 'series-parallel-circuit' }>
  uid: string
}) {
  return (
    <g>
      {/* Main outer loop */}
      <polyline
        points="66,155 66,86 210,86"
        fill="none"
        strokeWidth={2.2}
        className="stroke-slate-600 dark:stroke-slate-300"
      />
      <polyline
        points="66,185 66,238 356,238 356,145"
        fill="none"
        strokeWidth={2.2}
        className="stroke-slate-600 dark:stroke-slate-300"
      />
      {/* Parallel split at x=210 to x=356 (top y=58, bottom y=126) */}
      <polyline
        points="210,86 210,56 356,56 356,145"
        fill="none"
        strokeWidth={2.2}
        className="stroke-slate-600 dark:stroke-slate-300"
      />
      <polyline
        points="210,86 210,124 356,124"
        fill="none"
        strokeWidth={2.2}
        className="stroke-slate-600 dark:stroke-slate-300"
      />
      {/* Junction nodes */}
      <circle cx={210} cy={86} r={4} className="fill-slate-700 dark:fill-slate-200" />
      <circle cx={356} cy={124} r={4} className="fill-slate-700 dark:fill-slate-200" />

      {/* Battery on left branch */}
      <line x1={50} y1={162} x2={82} y2={162} strokeWidth={3} className="stroke-amber-500" />
      <line x1={57} y1={174} x2={75} y2={174} strokeWidth={2} className="stroke-amber-500" />
      <text x={90} y={173} fontSize={12.5} fontWeight={800} className="fill-amber-600 font-mono dark:fill-amber-300">
        V = {d.voltage} V
      </text>

      {/* Current arrow */}
      <line
        x1={78}
        y1={72}
        x2={108}
        y2={72}
        strokeWidth={2}
        markerEnd={`url(#arrow-cyan-${uid})`}
        className="stroke-cyan-500"
      />
      <text x={93} y={66} textAnchor="middle" fontSize={10.5} fontWeight={700} className="fill-cyan-600 font-mono dark:fill-cyan-300">
        I_tot
      </text>

      {/* R1 series, R2 top parallel, R3 bottom parallel */}
      <ResistorSymbol x={144} y={86} label={`R₁ = ${d.r1} Ω`} />
      <ResistorSymbol x={283} y={56} label={`R₂ = ${d.r2} Ω`} />
      <ResistorSymbol x={283} y={124} label={`R₃ = ${d.r3} Ω`} />
    </g>
  )
}

function SupplyDemandBody({
  d,
}: {
  d: Extract<ParametricDiagram, { kind: 'supply-demand' }>
}) {
  const eqQ = (d.demandIntercept - d.supplyIntercept) / (d.demandSlope + d.supplySlope)
  const eqP = d.demandIntercept - d.demandSlope * eqQ
  const maxQ = Math.max(eqQ * 1.65, d.demandIntercept / d.demandSlope, 10)
  const maxP = Math.max(d.demandIntercept * 1.15, eqP * 1.5, 20)

  const padL = 52
  const padT = 38
  const w = 330
  const h = 204
  const sx = (q: number) => padL + (q / maxQ) * w
  const sy = (p: number) => padT + h - (p / maxP) * h

  const qDemandZero = d.demandIntercept / d.demandSlope
  const qSupplyTop = (maxP - d.supplyIntercept) / d.supplySlope
  const taxQ = d.tax > 0 ? Math.max(0, (d.demandIntercept - d.supplyIntercept - d.tax) / (d.demandSlope + d.supplySlope)) : eqQ
  const pBuyer = d.demandIntercept - d.demandSlope * taxQ
  const pSeller = d.supplyIntercept + d.supplySlope * taxQ

  return (
    <g>
      {/* Axes */}
      <line x1={padL} y1={padT} x2={padL} y2={padT + h} strokeWidth={1.8} className="stroke-slate-500 dark:stroke-slate-400" />
      <line x1={padL} y1={padT + h} x2={padL + w} y2={padT + h} strokeWidth={1.8} className="stroke-slate-500 dark:stroke-slate-400" />
      <text x={padL - 10} y={padT + 8} textAnchor="end" fontSize={12} fontWeight={800} className="fill-slate-600 dark:fill-slate-300">
        P
      </text>
      <text x={padL + w - 4} y={padT + h + 18} textAnchor="end" fontSize={12} fontWeight={800} className="fill-slate-600 dark:fill-slate-300">
        Q
      </text>

      {/* Consumer surplus or DWL shading */}
      {d.tax > 0 ? (
        <polygon
          points={`${sx(taxQ)},${sy(pBuyer)} ${sx(eqQ)},${sy(eqP)} ${sx(taxQ)},${sy(pSeller)}`}
          className="fill-rose-500/25 stroke-rose-500/60"
          strokeWidth={1.2}
        />
      ) : (
        <polygon
          points={`${sx(0)},${sy(d.demandIntercept)} ${sx(eqQ)},${sy(eqP)} ${sx(0)},${sy(eqP)}`}
          className="fill-cyan-500/15"
        />
      )}

      {/* Demand curve P = a - bQ */}
      <line
        x1={sx(0)}
        y1={sy(d.demandIntercept)}
        x2={sx(Math.min(maxQ, qDemandZero))}
        y2={sy(Math.max(0, d.demandIntercept - d.demandSlope * Math.min(maxQ, qDemandZero)))}
        strokeWidth={2.6}
        className="stroke-cyan-600 dark:stroke-cyan-400"
      />
      {/* Supply curve P = c + dQ */}
      <line
        x1={sx(0)}
        y1={sy(d.supplyIntercept)}
        x2={sx(Math.min(maxQ, qSupplyTop))}
        y2={sy(d.supplyIntercept + d.supplySlope * Math.min(maxQ, qSupplyTop))}
        strokeWidth={2.6}
        className="stroke-emerald-600 dark:stroke-emerald-400"
      />
      {/* Shifted tax supply curve if tax > 0 */}
      {d.tax > 0 && (
        <line
          x1={sx(0)}
          y1={sy(d.supplyIntercept + d.tax)}
          x2={sx(Math.min(maxQ, (maxP - d.supplyIntercept - d.tax) / d.supplySlope))}
          y2={sy(
            d.supplyIntercept +
              d.tax +
              d.supplySlope * Math.min(maxQ, (maxP - d.supplyIntercept - d.tax) / d.supplySlope),
          )}
          strokeDasharray="5 4"
          strokeWidth={2}
          className="stroke-amber-500"
        />
      )}

      {/* Equilibrium dashed drop lines */}
      <line x1={sx(eqQ)} y1={sy(eqP)} x2={sx(eqQ)} y2={padT + h} strokeDasharray="4 4" strokeWidth={1.2} className="stroke-slate-400" />
      <line x1={padL} y1={sy(eqP)} x2={sx(eqQ)} y2={sy(eqP)} strokeDasharray="4 4" strokeWidth={1.2} className="stroke-slate-400" />
      <circle cx={sx(eqQ)} cy={sy(eqP)} r={5} className="fill-brand-500" />

      <text x={20} y={24} fontSize={11.5} fontWeight={800} className="fill-slate-800 font-mono dark:fill-slate-100">
        D: P = {d.demandIntercept} − {d.demandSlope}Q · S: P = {d.supplyIntercept} + {d.supplySlope}Q
        {d.tax > 0 ? ` · tax = $${d.tax}` : ''}
      </text>
    </g>
  )
}

function NormalCurveBody({
  d,
}: {
  d: Extract<ParametricDiagram, { kind: 'normal-curve' }>
}) {
  const padL = 36
  const w = 348
  const baseY = 232
  const peakH = 156
  const minZ = -3.5
  const maxZ = 3.5
  const zVal = Math.max(minZ, Math.min(maxZ, (d.x - d.mean) / d.sd))

  const sx = (z: number) => padL + ((z - minZ) / (maxZ - minZ)) * w
  const pdf = (z: number) => Math.exp(-0.5 * z * z)
  const sy = (z: number) => baseY - pdf(z) * peakH

  const steps = 84
  const curvePts: string[] = []
  for (let i = 0; i <= steps; i += 1) {
    const z = minZ + ((maxZ - minZ) * i) / steps
    curvePts.push(`${sx(z).toFixed(1)},${sy(z).toFixed(1)}`)
  }

  // Shaded area according to asked tail
  const shadePoly = (zFrom: number, zTo: number): string => {
    const segs = 40
    const pts = [`${sx(zFrom).toFixed(1)},${baseY}`]
    for (let i = 0; i <= segs; i += 1) {
      const z = zFrom + ((zTo - zFrom) * i) / segs
      pts.push(`${sx(z).toFixed(1)},${sy(z).toFixed(1)}`)
    }
    pts.push(`${sx(zTo).toFixed(1)},${baseY}`)
    return pts.join(' ')
  }

  return (
    <g>
      {/* Shaded region */}
      {d.ask === 'upperTail' ? (
        <polygon points={shadePoly(zVal, maxZ)} className="fill-brand-500/25" />
      ) : d.ask === 'twoTailed' ? (
        <>
          <polygon points={shadePoly(minZ, -Math.abs(zVal))} className="fill-brand-500/25" />
          <polygon points={shadePoly(Math.abs(zVal), maxZ)} className="fill-brand-500/25" />
        </>
      ) : (
        <polygon points={shadePoly(minZ, zVal)} className="fill-brand-500/25" />
      )}

      {/* Baseline */}
      <line x1={padL} y1={baseY} x2={padL + w} y2={baseY} strokeWidth={1.6} className="stroke-slate-500 dark:stroke-slate-400" />
      {/* Mean line */}
      <line x1={sx(0)} y1={sy(0)} x2={sx(0)} y2={baseY} strokeDasharray="4 4" strokeWidth={1.3} className="stroke-slate-400" />
      {/* Cutoff x line */}
      <line x1={sx(zVal)} y1={sy(zVal)} x2={sx(zVal)} y2={baseY} strokeWidth={2.2} className="stroke-amber-500" />
      {/* Bell curve */}
      <polyline points={curvePts.join(' ')} fill="none" strokeWidth={2.6} className="stroke-brand-600 dark:stroke-brand-400" />

      {/* Tick labels */}
      {[-2, -1, 0, 1, 2].map((z) => (
        <text
          key={z}
          x={sx(z)}
          y={baseY + 18}
          textAnchor="middle"
          fontSize={10.5}
          className="fill-slate-500 font-mono dark:fill-slate-400"
        >
          {Math.round((d.mean + z * d.sd) * 10) / 10}
        </text>
      ))}
      <text
        x={sx(zVal)}
        y={Math.max(46, sy(zVal) - 8)}
        textAnchor="middle"
        fontSize={12}
        fontWeight={800}
        className="fill-amber-600 font-mono dark:fill-amber-300"
      >
        x = {d.x}
      </text>
      <text x={20} y={26} fontSize={12} fontWeight={800} className="fill-slate-800 font-mono dark:fill-slate-100">
        N(μ = {d.mean}, σ = {d.sd})
      </text>
    </g>
  )
}
