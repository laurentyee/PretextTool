import { bboxFor, computeCentroid, dist, type Mark, type Point } from '../doodleGeometry'

export type HitResult = { mark: Mark; handle: boolean }
export type DragInfo = { id: number; startX: number; startY: number; dx0: number; dy0: number }
export type ScaleInfo = { id: number; centroid: Point; startScale: number; startDist: number }

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

export function beginDrag(mark: Mark, p: Point): DragInfo {
  return { id: mark.id, startX: p.x, startY: p.y, dx0: mark.dx, dy0: mark.dy }
}

export function applyDrag(mark: Mark, drag: DragInfo, p: Point): void {
  mark.dx = drag.dx0 + (p.x - drag.startX)
  mark.dy = drag.dy0 + (p.y - drag.startY)
}

export function beginScale(mark: Mark, p: Point): ScaleInfo {
  const centroid = computeCentroid(mark)
  return { id: mark.id, centroid, startScale: mark.scale, startDist: Math.max(6, dist(p, centroid)) }
}

export function applyScale(mark: Mark, scaleInfo: ScaleInfo, p: Point): void {
  const ratio = dist(p, scaleInfo.centroid) / scaleInfo.startDist
  mark.scale = Math.min(4, Math.max(0.3, scaleInfo.startScale * ratio))
}

export function drawSelection(
  ctx: CanvasRenderingContext2D,
  mark: Mark,
  palette: { selectionStroke: string; selectionHandle: string },
): void {
  const b = bboxFor(mark)
  ctx.save()
  ctx.strokeStyle = palette.selectionStroke
  ctx.setLineDash([4, 4])
  ctx.lineWidth = 1
  ctx.strokeRect(b.minX, b.minY, b.maxX - b.minX, b.maxY - b.minY)
  ctx.setLineDash([])
  ctx.fillStyle = palette.selectionHandle
  ctx.fillRect(b.maxX - 5, b.maxY - 5, 10, 10)
  ctx.restore()
}
