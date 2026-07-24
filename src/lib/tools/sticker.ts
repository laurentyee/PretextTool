import { stickerRect, type Point, type StickerMark } from '../doodleGeometry'
import { loadStickerImage } from './stickers'

const STICKER_MAX_DIM = 170

/** Returns null if the sticker's image hasn't finished loading yet. */
export function createStickerMark(id: number, p: Point, stickerId: string): StickerMark | null {
  const img = loadStickerImage(stickerId)
  if (!img || !img.complete || img.naturalWidth === 0) return null

  const ratio = img.naturalWidth / img.naturalHeight
  const baseWidth = ratio >= 1 ? STICKER_MAX_DIM : STICKER_MAX_DIM * ratio
  const baseHeight = ratio >= 1 ? STICKER_MAX_DIM / ratio : STICKER_MAX_DIM

  return {
    kind: 'sticker',
    id,
    centroid: { x: p.x, y: p.y },
    dx: 0,
    dy: 0,
    scale: 1,
    stickerId,
    baseWidth,
    baseHeight,
  }
}

export function drawStickerMark(ctx: CanvasRenderingContext2D, mark: StickerMark): void {
  const img = loadStickerImage(mark.stickerId)
  if (!img || !img.complete || img.naturalWidth === 0) return
  const r = stickerRect(mark)
  ctx.drawImage(img, r.minX, r.minY, r.maxX - r.minX, r.maxY - r.minY)
}
