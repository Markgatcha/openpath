import type { FigureGeometry } from '@shared/figure'

/**
 * Renders figure-question geometry as clean SVG. The asked quantity is
 * already labeled "?" by the shared engine, so this component never
 * learns the answer.
 */
export function FigureCanvas({
  geometry,
  className,
  size = 260,
}: {
  geometry: FigureGeometry
  className?: string
  size?: number
}) {
  const { vertices, edges, angles, rightAngleAt, circle, radiusLine } = geometry

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
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
        // Push the label slightly below/above the midpoint.
        const dx = to.x - from.x
        const dy = to.y - from.y
        const len = Math.hypot(dx, dy) || 1
        const nx = -dy / len
        const ny = dx / len
        const offset = edge.label && index === 4 ? 7 : 4 // height marker sits outside
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
        // Offset the angle label toward the interior of the shape.
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
