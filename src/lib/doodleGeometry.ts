export type Point = { x: number; y: number }

export type Doodle = {
  id: number
  basePoints: Point[]
  centroid: Point
  dx: number
  dy: number
  scale: number
  color: string
  width: number
}

export type Bbox = { minX: number; minY: number; maxX: number; maxY: number }

export type HitResult = { doodle: Doodle; handle: boolean }

export function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function computeCentroid(d: Doodle): Point {
  return { x: d.centroid.x + d.dx, y: d.centroid.y + d.dy }
}

export function transformedPoints(d: Doodle): Point[] {
  return d.basePoints.map((p) => ({
    x: d.centroid.x + d.dx + (p.x - d.centroid.x) * d.scale,
    y: d.centroid.y + d.dy + (p.y - d.centroid.y) * d.scale,
  }))
}

export function drawStrokePath(
  g: CanvasRenderingContext2D,
  pts: Point[],
  lineWidth: number,
): void {
  if (pts.length === 0) return
  g.lineJoin = 'round'
  g.lineCap = 'round'
  g.lineWidth = lineWidth
  if (pts.length === 1) {
    g.beginPath()
    g.arc(pts[0].x, pts[0].y, lineWidth / 2, 0, Math.PI * 2)
    g.fill()
    return
  }
  g.beginPath()
  g.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y)
  g.stroke()
}

export function bboxFor(d: Doodle): Bbox {
  const pts = transformedPoints(d)
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  pts.forEach((p) => {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  })
  if (!isFinite(minX)) {
    minX = minY = maxX = maxY = 0
  }
  const pad = (d.width * d.scale) / 2 + 8
  return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad }
}

export function hitTest(doodles: Doodle[], selectedId: number | null, p: Point): HitResult | null {
  if (selectedId !== null) {
    const sel = doodles.find((x) => x.id === selectedId)
    if (sel) {
      const b = bboxFor(sel)
      if (dist(p, { x: b.maxX, y: b.maxY }) <= 12) return { doodle: sel, handle: true }
    }
  }
  for (let i = doodles.length - 1; i >= 0; i--) {
    const d = doodles[i]
    const b = bboxFor(d)
    if (p.x >= b.minX && p.x <= b.maxX && p.y >= b.minY && p.y <= b.maxY) {
      return { doodle: d, handle: false }
    }
  }
  return null
}
