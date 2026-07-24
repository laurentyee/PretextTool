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

/** A single scattered bar, positioned in the mark's local (base) coordinate space. */
export type ScatterBar = { x: number; y: number; w: number; h: number; color: string }

export type ScatterMark = MarkBase & {
  kind: 'scatter'
  basePoints: Point[]
  width: number
  coreColor: string
  strokeColor: string
  bars: ScatterBar[]
}

export type Mark = StrokeMark | StickerMark | ScatterMark

export type Bbox = { minX: number; minY: number; maxX: number; maxY: number }

export function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function computeCentroid(mark: Mark): Point {
  return { x: mark.centroid.x + mark.dx, y: mark.centroid.y + mark.dy }
}

type PathMark = { basePoints: Point[] } & MarkBase

export function transformedPoints(mark: PathMark): Point[] {
  return mark.basePoints.map((p) => ({
    x: mark.centroid.x + mark.dx + (p.x - mark.centroid.x) * mark.scale,
    y: mark.centroid.y + mark.dy + (p.y - mark.centroid.y) * mark.scale,
  }))
}

/** Transforms a scatter mark's bars into screen-space rects, honoring dx/dy/scale. */
export function transformedBars(mark: ScatterMark): { rect: Bbox; color: string }[] {
  return mark.bars.map((bar) => {
    const cx = mark.centroid.x + mark.dx + (bar.x - mark.centroid.x) * mark.scale
    const cy = mark.centroid.y + mark.dy + (bar.y - mark.centroid.y) * mark.scale
    const halfW = (bar.w * mark.scale) / 2
    const halfH = (bar.h * mark.scale) / 2
    return {
      rect: { minX: cx - halfW, minY: cy - halfH, maxX: cx + halfW, maxY: cy + halfH },
      color: bar.color,
    }
  })
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

function pointsBbox(pts: Point[], pad: number): Bbox {
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
  return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad }
}

function strokeBbox(mark: StrokeMark): Bbox {
  return pointsBbox(transformedPoints(mark), (mark.width * mark.scale) / 2 + 8)
}

function unionBbox(a: Bbox, b: Bbox): Bbox {
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  }
}

function scatterBbox(mark: ScatterMark): Bbox {
  let bbox = pointsBbox(transformedPoints(mark), (mark.width * mark.scale) / 2 + 8)
  for (const bar of transformedBars(mark)) bbox = unionBbox(bbox, bar.rect)
  return bbox
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
  if (mark.kind === 'scatter') return scatterBbox(mark)
  const r = stickerRect(mark)
  const pad = 8
  return { minX: r.minX - pad, minY: r.minY - pad, maxX: r.maxX + pad, maxY: r.maxY + pad }
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

export function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

/**
 * A random offset vector for scattering marks around a point. Most samples land
 * within `radius`, but a fraction get "flung" out to several times that distance,
 * giving the scatter a dynamic, uneven spread instead of a uniform disc.
 */
export function scatterOffset(radius: number): Point {
  const angle = Math.random() * Math.PI * 2
  const flung = Math.random() < 0.2
  const distance = flung ? radius * randRange(1, 4) : radius * Math.random()
  return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance }
}

/** Weighted random pick from a flat list of candidate colors (repeats bias the weighting). */
export function pickScatterColor(palette: string[]): string {
  return palette[Math.floor(Math.random() * palette.length)]
}
