import { readCssVar } from '../readStyle'
import {
  dist,
  drawStrokePath,
  pickScatterColor,
  randRange,
  scatterOffset,
  transformedBars,
  transformedPoints,
  type Point,
  type ScatterMark,
} from '../doodleGeometry'

export const SCATTER_CORE_COLOR = readCssVar('--color-scatter-core')
export const SCATTER_STROKE_COLOR = readCssVar('--color-scatter-stroke')
export const SCATTER_ACCENT_COLORS = [
  '--color-scatter-accent-1',
  '--color-scatter-accent-2',
  '--color-scatter-accent-3',
].map(readCssVar)

// Weighted so most scattered bars pick up the core orange, with purple/gray/black accents mixed in.
const SCATTER_BAR_PALETTE = [SCATTER_CORE_COLOR, SCATTER_CORE_COLOR, SCATTER_CORE_COLOR, ...SCATTER_ACCENT_COLORS]

export function createScatterMark(id: number, p: Point, width: number): ScatterMark {
  return {
    kind: 'scatter',
    id,
    basePoints: [p],
    centroid: { x: p.x, y: p.y },
    dx: 0,
    dy: 0,
    scale: 1,
    width,
    coreColor: SCATTER_CORE_COLOR,
    strokeColor: SCATTER_STROKE_COLOR,
    bars: [],
  }
}

export function spawnScatterBars(mark: ScatterMark, from: Point, to: Point, brushSize: number): void {
  const traveled = dist(from, to)
  const count = Math.min(8, Math.max(1, Math.round(traveled / 5)))
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 1 : i / (count - 1)
    const along: Point = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t }
    const offset = scatterOffset(brushSize)
    mark.bars.push({
      x: along.x + offset.x,
      y: along.y + offset.y,
      w: randRange(3, brushSize * 0.4),
      h: randRange(brushSize * 0.6, brushSize * 2.2),
      color: pickScatterColor(SCATTER_BAR_PALETTE),
    })
  }
}

export function drawScatterMark(ctx: CanvasRenderingContext2D, mark: ScatterMark): void {
  const pts = transformedPoints(mark)
  ctx.save()
  ctx.globalAlpha = 0.92
  ctx.fillStyle = mark.coreColor
  ctx.strokeStyle = mark.coreColor
  drawStrokePath(ctx, pts, mark.width * mark.scale)
  ctx.lineWidth = 1.5
  ctx.strokeStyle = mark.strokeColor
  ctx.globalAlpha = 0.7
  drawStrokePath(ctx, pts, mark.width * mark.scale)
  ctx.restore()

  ctx.save()
  for (const bar of transformedBars(mark)) {
    ctx.fillStyle = bar.color
    ctx.fillRect(bar.rect.minX, bar.rect.minY, bar.rect.maxX - bar.rect.minX, bar.rect.maxY - bar.rect.minY)
  }
  ctx.restore()
}
