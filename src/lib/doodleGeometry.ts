export type Point = { x: number; y: number }

type MarkBase = {
  id: number
  centroid: Point
  dx: number
  dy: number
  scale: number
}

export type StrokeMark = MarkBase & {
  kind: 'stroke'
  basePoints: Point[]
  color: string
  width: number
}

export type StickerMark = MarkBase & {
  kind: 'sticker'
  stickerId: string
  /** Display size at scale=1, aspect ratio preserved from the source image. */
  baseWidth: number
  baseHeight: number
}

export type Mark = StrokeMark | StickerMark

export type Bbox = { minX: number; minY: number; maxX: number; maxY: number }

export type HitResult = { mark: Mark; handle: boolean }

export function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function computeCentroid(mark: Mark): Point {
  return { x: mark.centroid.x + mark.dx, y: mark.centroid.y + mark.dy }
}

export function transformedPoints(mark: StrokeMark): Point[] {
  return mark.basePoints.map((p) => ({
    x: mark.centroid.x + mark.dx + (p.x - mark.centroid.x) * mark.scale,
    y: mark.centroid.y + mark.dy + (p.y - mark.centroid.y) * mark.scale,
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

function strokeBbox(mark: StrokeMark): Bbox {
  const pts = transformedPoints(mark)
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
  const pad = (mark.width * mark.scale) / 2 + 8
  return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad }
}

/** The sticker's true image rect, with no selection-handle padding. */
export function stickerRect(mark: StickerMark): Bbox {
  const c = computeCentroid(mark)
  const halfW = (mark.baseWidth * mark.scale) / 2
  const halfH = (mark.baseHeight * mark.scale) / 2
  return { minX: c.x - halfW, minY: c.y - halfH, maxX: c.x + halfW, maxY: c.y + halfH }
}

export function bboxFor(mark: Mark): Bbox {
  if (mark.kind === 'stroke') return strokeBbox(mark)
  const r = stickerRect(mark)
  const pad = 8
  return { minX: r.minX - pad, minY: r.minY - pad, maxX: r.maxX + pad, maxY: r.maxY + pad }
}

export function hitTest(marks: Mark[], selectedId: number | null, p: Point): HitResult | null {
  if (selectedId !== null) {
    const sel = marks.find((x) => x.id === selectedId)
    if (sel) {
      const b = bboxFor(sel)
      if (dist(p, { x: b.maxX, y: b.maxY }) <= 12) return { mark: sel, handle: true }
    }
  }
  for (let i = marks.length - 1; i >= 0; i--) {
    const mark = marks[i]
    const b = bboxFor(mark)
    if (p.x >= b.minX && p.x <= b.maxX && p.y >= b.minY && p.y <= b.maxY) {
      return { mark, handle: false }
    }
  }
  return null
}

const RAINBOW_STOPS: [number, string][] = [
  [0, 'hsl(0, 90%, 60%)'],
  [1 / 6, 'hsl(40, 95%, 58%)'],
  [2 / 6, 'hsl(90, 85%, 55%)'],
  [3 / 6, 'hsl(160, 80%, 50%)'],
  [4 / 6, 'hsl(210, 90%, 60%)'],
  [5 / 6, 'hsl(260, 85%, 65%)'],
  [1, 'hsl(310, 90%, 62%)'],
]

/** A bright multi-stop gradient across a mark's bounding box, for the rainbow brush. */
export function rainbowGradient(ctx: CanvasRenderingContext2D, bbox: Bbox): CanvasGradient {
  const g = ctx.createLinearGradient(bbox.minX, bbox.minY, bbox.maxX, bbox.maxY)
  for (const [offset, color] of RAINBOW_STOPS) g.addColorStop(offset, color)
  return g
}
