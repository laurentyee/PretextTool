import { bboxForStroke } from './tools/brush'
import { bboxForSticker } from './tools/sticker'

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

export function pointsBbox(pts: Point[], pad: number): Bbox {
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

/** Dispatches to each tool's own bbox function — the tools own their mark-shape logic. */
export function bboxFor(mark: Mark): Bbox {
  if (mark.kind === 'stroke') return bboxForStroke(mark)
  return bboxForSticker(mark)
}
