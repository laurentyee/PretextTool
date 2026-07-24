import { readCssVar } from '../utils/readStyle'
import { drawStrokePath, pointsBbox, transformedPoints, type Bbox, type Point, type StrokeMark } from '../doodleGeometry'

const BRUSH_BLUR = readCssVar('--blur-brush')

export function bboxForStroke(mark: StrokeMark): Bbox {
  return pointsBbox(transformedPoints(mark), (mark.width * mark.scale) / 2 + 8)
}

type GradientDef = { id: string; label: string; stops: number }

const GRADIENT_DEFS: GradientDef[] = [
  { id: 'rainbow', label: 'Rainbow', stops: 7 },
  { id: 'warm', label: 'Warm', stops: 5 },
  { id: 'monet', label: 'Monet', stops: 5 },
  { id: 'candy', label: 'Candy', stops: 5 },
  { id: 'citrus', label: 'Citrus', stops: 3 },
]

const cssVarsFor = (def: GradientDef): string[] =>
  Array.from({ length: def.stops }, (_, i) => `--color-${def.id}-${i + 1}`)

// Canvas gradient stops, resolved once at module load.
const GRADIENT_STOPS: Record<string, [number, string][]> = Object.fromEntries(
  GRADIENT_DEFS.map((def) => {
    const colors = cssVarsFor(def).map(readCssVar)
    return [def.id, colors.map((color, i) => [i / (colors.length - 1), color])]
  }),
)

export const DEFAULT_GRADIENT_ID = GRADIENT_DEFS[0].id

/** CSS `background` value for a DOM swatch preview — same source vars as the canvas gradient, via live var() refs. */
export function gradientCssPreview(id: string): string {
  const def = GRADIENT_DEFS.find((d) => d.id === id)
  if (!def) return ''
  return `linear-gradient(to right, ${cssVarsFor(def)
    .map((v) => `var(${v})`)
    .join(', ')})`
}

function gradientPaint(ctx: CanvasRenderingContext2D, id: string, bbox: Bbox): CanvasGradient {
  const g = ctx.createLinearGradient(bbox.minX, bbox.minY, bbox.maxX, bbox.maxY)
  const stops = GRADIENT_STOPS[id] ?? GRADIENT_STOPS[DEFAULT_GRADIENT_ID]
  for (const [offset, color] of stops) g.addColorStop(offset, color)
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
  const paint = gradientPaint(ctx, mark.color, bboxForStroke(mark))
  ctx.save()
  ctx.filter = `blur(${BRUSH_BLUR})`
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
  const ringPaint = gradientPaint(ctx, color, ringBbox)
  ctx.save()
  ctx.strokeStyle = ringPaint
  ctx.globalAlpha = 0.55
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.arc(hover.x, hover.y, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}
