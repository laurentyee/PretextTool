import animalWorldUrl from '../../assets/paintings/derived/animal-world.jpg'
import huangYaoUrl from '../../assets/paintings/derived/huang-yao.jpg'
import monetUrl from '../../assets/paintings/derived/monet.jpg'

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
