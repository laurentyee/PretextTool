import {
  prepareWithSegments,
  layoutNextLine,
  type PreparedTextWithSegments,
  type LayoutCursor,
} from '@chenglou/pretext'
import { drawStrokePath, transformedPoints, type Mark } from './doodleGeometry'
import { stickerRect } from './tools/sticker'

const PADDING_TOP = 26
const PADDING_RIGHT = 26
const PADDING_LEFT = 12
const PADDING_BOTTOM = 8
const GUTTER = 40
const MIN_SLOT_CHARS = 3

export type Slot = { x: number; y: number; width: number }
export type TextDraw = { text: string; x: number; y: number }

export type ParagraphState = {
  prepared: PreparedTextWithSegments
  cursor: LayoutCursor | null
}

export function prepareParagraphs(text: string, font: string): ParagraphState[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((paragraph) => ({
      prepared: prepareWithSegments(paragraph, font, { wordBreak: 'normal', whiteSpace: 'normal' }),
      cursor: { segmentIndex: 0, graphemeIndex: 0 },
    }))
}

export function resetParagraphs(paragraphs: ParagraphState[]): void {
  paragraphs.forEach((state) => {
    state.cursor = { segmentIndex: 0, graphemeIndex: 0 }
  })
}

const MARK_CLEARANCE = 10

export function paintMask(
  maskCtx: CanvasRenderingContext2D,
  width: number,
  height: number,
  marks: Mark[],
): void {
  maskCtx.clearRect(0, 0, width, height)
  maskCtx.fillStyle = '#fff'
  maskCtx.strokeStyle = '#fff'
  marks.forEach((mark) => {
    if (mark.kind === 'stroke') {
      const pts = transformedPoints(mark)
      drawStrokePath(maskCtx, pts, mark.width * mark.scale + MARK_CLEARANCE)
      return
    }
    const r = stickerRect(mark)
    maskCtx.fillRect(
      r.minX - MARK_CLEARANCE,
      r.minY - MARK_CLEARANCE,
      r.maxX - r.minX + MARK_CLEARANCE * 2,
      r.maxY - r.minY + MARK_CLEARANCE * 2,
    )
  })
}

function occupiedAt(
  imgData: Uint8ClampedArray,
  mw: number,
  mh: number,
  dpr: number,
  cx: number,
  cy: number,
): boolean {
  const px = Math.min(mw - 1, Math.max(0, Math.round(cx * dpr)))
  const py = Math.min(mh - 1, Math.max(0, Math.round(cy * dpr)))
  return imgData[(py * mw + px) * 4 + 3] > 10
}

export function computeSlots(
  maskCtx: CanvasRenderingContext2D,
  maskWidth: number,
  maskHeight: number,
  dpr: number,
  stageWidth: number,
  stageHeight: number,
  measureCtx: CanvasRenderingContext2D,
  font: string,
  lineHeight: number,
): Slot[] {
  const imgData = maskCtx.getImageData(0, 0, maskWidth, maskHeight).data
  const availW = stageWidth - PADDING_LEFT - PADDING_RIGHT
  const availH = stageHeight - PADDING_TOP - PADDING_BOTTOM
  const colCount = Math.max(1, Math.min(3, Math.floor(availW / 380)))
  const colWidth = (availW - GUTTER * (colCount - 1)) / colCount
  const rows = Math.max(1, Math.floor(availH / lineHeight))

  measureCtx.font = font
  const avgCharWidth = measureCtx.measureText('mmmmmmmmmm').width / 10
  const minSlot = avgCharWidth * MIN_SLOT_CHARS

  const slots: Slot[] = []
  for (let c = 0; c < colCount; c++) {
    const colX = PADDING_LEFT + c * (colWidth + GUTTER)
    for (let r = 0; r < rows; r++) {
      const rowY = PADDING_TOP + r * lineHeight
      const baseline = rowY + lineHeight * 0.72
      const step = 3
      const n = Math.ceil(colWidth / step)
      const ySamples = [rowY + lineHeight * 0.25, rowY + lineHeight * 0.55, rowY + lineHeight * 0.85]
      const occ: boolean[] = new Array(n + 1)
      for (let i = 0; i <= n; i++) {
        const x = colX + i * step
        let hit = false
        for (const sy of ySamples) {
          if (occupiedAt(imgData, maskWidth, maskHeight, dpr, x, sy)) {
            hit = true
            break
          }
        }
        occ[i] = hit
      }
      let i = 0
      while (i <= n) {
        if (!occ[i]) {
          let j = i
          while (j <= n && !occ[j]) j++
          const freeWidth = (j - i) * step
          if (freeWidth >= minSlot) {
            slots.push({ x: colX + i * step, y: baseline, width: freeWidth })
          }
          i = j
        } else {
          i++
        }
      }
    }
  }
  return slots
}

export function fillSlotsWithPretext(
  paragraphs: ParagraphState[],
  slots: Slot[],
  measureCtx: CanvasRenderingContext2D,
): TextDraw[] {
  const draws: TextDraw[] = []
  let pIndex = 0
  for (const slot of slots) {
    while (pIndex < paragraphs.length && paragraphs[pIndex].cursor === null) pIndex++
    if (pIndex >= paragraphs.length) break
    const state = paragraphs[pIndex]
    const line = layoutNextLine(state.prepared, state.cursor as LayoutCursor, slot.width)
    if (line === null) {
      state.cursor = null
      pIndex++
      continue
    }
    state.cursor = line.end

    const words = line.text.split(' ').filter(Boolean)
    const spaceWidth = measureCtx.measureText(' ').width
    const wordWidths = words.map((w) => measureCtx.measureText(w).width)

    let x = slot.x
    words.forEach((word, i) => {
      draws.push({ text: word, x, y: slot.y })
      x += wordWidths[i] + spaceWidth
    })
  }
  return draws
}
