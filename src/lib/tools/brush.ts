import { readCssVar } from '../utils/readStyle'
import { drawStrokePath, pointsBbox, transformedPoints, type Bbox, type Point, type StrokeMark } from '../doodleGeometry'

export const BRUSH_COLORS = ['--color-brush-1', '--color-brush-2', '--color-brush-3', '--color-brush-4'].map(
  readCssVar,
)
export const RAINBOW = 'rainbow' as const

export function bboxForStroke(mark: StrokeMark): Bbox {
  return pointsBbox(transformedPoints(mark), (mark.width * mark.scale) / 2 + 8)
}

const RAINBOW_COLORS = [
  '--color-rainbow-1',
  '--color-rainbow-2',
  '--color-rainbow-3',
  '--color-rainbow-4',
  '--color-rainbow-5',
  '--color-rainbow-6',
  '--color-rainbow-7',
].map(readCssVar)

const RAINBOW_STOPS: [number, string][] = RAINBOW_COLORS.map((color, i) => [
  i / (RAINBOW_COLORS.length - 1),
  color,
])

/** A bright multi-stop gradient across a mark's bounding box, for the rainbow brush. */
function rainbowGradient(ctx: CanvasRenderingContext2D, bbox: Bbox): CanvasGradient {
  const g = ctx.createLinearGradient(bbox.minX, bbox.minY, bbox.maxX, bbox.maxY)
  for (const [offset, color] of RAINBOW_STOPS) g.addColorStop(offset, color)
  return g
}

export function createBrushMark(id: number, p: Point, color: string, width: number): StrokeMark {
  return {
    kind: 'stroke',
    id,
    basePoints: [p],
    centroid: { x: p.x, y: p.y },
    dx: 0,
    dy: 0,
    scale: 1,
    color,
    width,
  }
}

export function drawBrushMark(ctx: CanvasRenderingContext2D, mark: StrokeMark): void {
  const pts = transformedPoints(mark)
  const paint = mark.color === RAINBOW ? rainbowGradient(ctx, bboxForStroke(mark)) : mark.color
  ctx.save()
  ctx.globalAlpha = 0.92
  ctx.fillStyle = paint
  ctx.strokeStyle = paint
  drawStrokePath(ctx, pts, mark.width * mark.scale)
  ctx.restore()
}

export function drawBrushHoverRing(
  ctx: CanvasRenderingContext2D,
  hover: Point,
  brushSize: number,
  color: string,
): void {
  const r = brushSize / 2
  const ringBbox: Bbox = { minX: hover.x - r, minY: hover.y - r, maxX: hover.x + r, maxY: hover.y + r }
  const ringPaint = color === RAINBOW ? rainbowGradient(ctx, ringBbox) : color
  ctx.save()
  ctx.strokeStyle = ringPaint
  ctx.globalAlpha = 0.55
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.arc(hover.x, hover.y, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}
