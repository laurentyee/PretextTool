import animalWorldUrl from '../../../assets/paintings/derived/animal-world.jpg'
import huangYaoUrl from '../../../assets/paintings/derived/huang-yao.jpg'
import monetUrl from '../../../assets/paintings/derived/monet.jpg'
import { computeCentroid, type Bbox, type Point, type StickerMark } from '../doodleGeometry'

const STICKER_MAX_DIM = 170

export type StickerDef = { id: string; label: string; url: string }

export const STICKERS: StickerDef[] = [
  { id: 'animal-world', label: 'Animal World', url: animalWorldUrl },
  { id: 'huang-yao', label: 'Huang Yao', url: huangYaoUrl },
  { id: 'monet', label: 'Monet', url: monetUrl },
]

export const DEFAULT_STICKER_ID = STICKERS[0].id

export function getStickerDef(id: string): StickerDef | undefined {
  return STICKERS.find((s) => s.id === id)
}

const imageCache = new Map<string, HTMLImageElement>()

/** Lazily creates (and caches) an <img> for a sticker id, kicking off its load. */
export function loadStickerImage(id: string): HTMLImageElement | null {
  const cached = imageCache.get(id)
  if (cached) return cached

  const def = getStickerDef(id)
  if (!def) return null

  const img = new Image()
  img.src = def.url
  imageCache.set(id, img)
  return img
}

/** The sticker's true image rect, with no selection-handle padding. */
export function stickerRect(mark: StickerMark): Bbox {
  const c = computeCentroid(mark)
  const halfW = (mark.baseWidth * mark.scale) / 2
  const halfH = (mark.baseHeight * mark.scale) / 2
  return { minX: c.x - halfW, minY: c.y - halfH, maxX: c.x + halfW, maxY: c.y + halfH }
}

export function bboxForSticker(mark: StickerMark): Bbox {
  const r = stickerRect(mark)
  const pad = 8
  return { minX: r.minX - pad, minY: r.minY - pad, maxX: r.maxX + pad, maxY: r.maxY + pad }
}

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
