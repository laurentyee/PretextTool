import {
  bboxFor,
  computeCentroid,
  dist,
  drawStrokePath,
  hitTest,
  rainbowGradient,
  stickerRect,
  transformedPoints,
  type Bbox,
  type Mark,
  type Point,
  type StickerMark,
  type StrokeMark,
} from './doodleGeometry'
import {
  computeSlots,
  fillSlotsWithPretext,
  paintMask,
  prepareParagraphs,
  resetParagraphs,
  type ParagraphState,
  type TextDraw,
} from './textFlow'
import { DEFAULT_STICKER_ID, loadStickerImage, STICKERS } from './stickers'
import { DEFAULT_THEME_ID, getThemeDef } from './themes'

export type Tool = 'brush' | 'select' | 'sticker'
export type FontFamily = 'mono' | 'serif' | 'sans'

export type SceneSnapshot = {
  tool: Tool
  color: string
  brushSize: number
  canUndo: boolean
  canRedo: boolean
  selectedScale: number | null
  stickerId: string
  fontFamily: FontFamily
}

export const BRUSH_COLORS = ['#D4FF3D', '#FF5C7A', '#4CC9FF', '#FFD23D']
export const RAINBOW = 'rainbow' as const

const FONT_SIZE = 14
const LINE_HEIGHT = 26
export const MONO_FONT_STACK = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
const STICKER_MAX_DIM = 170

export const FONT_STACKS: Record<FontFamily, string> = {
  mono: MONO_FONT_STACK,
  serif: '"PP Editorial New", Georgia, serif',
  sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
}

export const FONT_FAMILY_OPTIONS: { id: FontFamily; label: string }[] = [
  { id: 'mono', label: 'Mono' },
  { id: 'serif', label: 'Serif' },
  { id: 'sans', label: 'Sans' },
]

type DragInfo = { id: number; startX: number; startY: number; dx0: number; dy0: number }
type ScaleInfo = { id: number; centroid: Point; startScale: number; startDist: number }

export class SceneEngine {
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private readonly maskCanvas: HTMLCanvasElement
  private readonly maskCtx: CanvasRenderingContext2D
  private readonly stage: HTMLElement
  private readonly sourceText: string
  private font: string
  private paragraphs: ParagraphState[]

  private dpr = Math.max(1, window.devicePixelRatio || 1)
  private width = 0
  private height = 0

  private tool: Tool = 'brush'
  private color = BRUSH_COLORS[0]
  private brushSize = 16
  private fontFamily: FontFamily = 'mono'
  private palette = getThemeDef(DEFAULT_THEME_ID).canvas
  private marks: Mark[] = []
  private selectedId: number | null = null
  private selectedStickerId: string = DEFAULT_STICKER_ID
  private nextId = 1

  private history: Mark[][] = []
  private future: Mark[][] = []
  private drawing: StrokeMark | null = null
  private dragInfo: DragInfo | null = null
  private scaleInfo: ScaleInfo | null = null
  private hoverPos: Point | null = null

  private layoutDirty = true
  private rafScheduled = false
  private rafHandle = 0
  private textDrawList: TextDraw[] = []

  private listeners = new Set<() => void>()

  constructor(canvas: HTMLCanvasElement, stage: HTMLElement, sourceText: string) {
    this.canvas = canvas
    this.stage = stage
    this.sourceText = sourceText

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('2D canvas context unavailable')
    this.ctx = ctx

    this.maskCanvas = document.createElement('canvas')
    const maskCtx = this.maskCanvas.getContext('2d', { willReadFrequently: true })
    if (!maskCtx) throw new Error('2D mask context unavailable')
    this.maskCtx = maskCtx

    this.font = `${FONT_SIZE}px ${FONT_STACKS[this.fontFamily]}`
    this.paragraphs = prepareParagraphs(sourceText, this.font)

    STICKERS.forEach((s) => {
      const img = loadStickerImage(s.id)
      if (img) img.onload = () => this.markDirty()
    })

    canvas.addEventListener('pointerdown', this.onPointerDown)
    canvas.addEventListener('pointermove', this.onPointerMove)
    window.addEventListener('pointerup', this.onPointerUp)
    canvas.addEventListener('pointerleave', this.onPointerLeave)

    this.resize()
    document.fonts.ready.then(() => this.markDirty()).catch(() => {})
  }

  destroy(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
    this.canvas.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('pointerup', this.onPointerUp)
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave)
    if (this.rafHandle) cancelAnimationFrame(this.rafHandle)
    this.listeners.clear()
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot = (): SceneSnapshot => {
    const selected =
      this.selectedId !== null ? this.marks.find((m) => m.id === this.selectedId) ?? null : null
    return {
      tool: this.tool,
      color: this.color,
      brushSize: this.brushSize,
      canUndo: this.history.length > 0,
      canRedo: this.future.length > 0,
      selectedScale: this.tool === 'select' && selected ? selected.scale : null,
      stickerId: this.selectedStickerId,
      fontFamily: this.fontFamily,
    }
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener())
  }

  // ---------- public controls ----------
  setTool(tool: Tool): void {
    this.tool = tool
    this.scheduleFrame()
    this.notify()
  }

  setColor(color: string): void {
    this.color = color
    this.notify()
  }

  setBrushSize(size: number): void {
    this.brushSize = size
    this.scheduleFrame()
    this.notify()
  }

  setSelectedScale(scale: number): void {
    if (this.selectedId === null) return
    const mark = this.marks.find((x) => x.id === this.selectedId)
    if (!mark) return
    mark.scale = scale
    this.markDirty()
    this.notify()
  }

  setStickerId(id: string): void {
    this.selectedStickerId = id
    this.notify()
  }

  setThemeId(id: string): void {
    this.palette = getThemeDef(id).canvas
    this.markDirty()
  }

  setFontFamily(choice: FontFamily): void {
    this.fontFamily = choice
    this.font = `${FONT_SIZE}px ${FONT_STACKS[choice]}`
    this.paragraphs = prepareParagraphs(this.sourceText, this.font)
    this.markDirty()
    this.notify()
  }

  undo(): void {
    if (this.history.length === 0) return
    this.future.push(structuredClone(this.marks))
    this.marks = this.history.pop() as Mark[]
    this.selectedId = null
    this.markDirty()
    this.notify()
  }

  redo(): void {
    if (this.future.length === 0) return
    this.history.push(structuredClone(this.marks))
    this.marks = this.future.pop() as Mark[]
    this.selectedId = null
    this.markDirty()
    this.notify()
  }

  clear(): void {
    if (this.marks.length === 0) return
    this.pushHistory()
    this.marks = []
    this.selectedId = null
    this.markDirty()
    this.notify()
  }

  resize(): void {
    const rect = this.stage.getBoundingClientRect()
    this.width = Math.max(1, Math.floor(rect.width))
    this.height = Math.max(1, Math.floor(rect.height))
    this.dpr = Math.max(1, window.devicePixelRatio || 1)
    ;[this.canvas, this.maskCanvas].forEach((c) => {
      c.width = Math.floor(this.width * this.dpr)
      c.height = Math.floor(this.height * this.dpr)
      c.style.width = `${this.width}px`
      c.style.height = `${this.height}px`
    })
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    this.maskCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    // Resizing the canvas backing store clears it immediately; recompute and
    // repaint synchronously here (instead of only via markDirty()'s rAF) so
    // the browser never gets a chance to composite a blank in-between frame.
    this.computeLayout()
    this.layoutDirty = false
    this.render()
  }

  // ---------- render loop ----------
  private markDirty(): void {
    this.layoutDirty = true
    this.scheduleFrame()
  }

  private scheduleFrame(): void {
    if (this.rafScheduled) return
    this.rafScheduled = true
    this.rafHandle = requestAnimationFrame(this.frame)
  }

  private frame = (): void => {
    this.rafScheduled = false
    if (this.layoutDirty) {
      this.computeLayout()
      this.layoutDirty = false
    }
    this.render()
  }

  private computeLayout(): void {
    paintMask(this.maskCtx, this.width, this.height, this.marks)
    resetParagraphs(this.paragraphs)
    const slots = computeSlots(
      this.maskCtx,
      this.maskCanvas.width,
      this.maskCanvas.height,
      this.dpr,
      this.width,
      this.height,
      this.ctx,
      this.font,
      LINE_HEIGHT,
    )
    this.textDrawList = fillSlotsWithPretext(this.paragraphs, slots, this.ctx)
  }

  private drawGrid(): void {
    const ctx = this.ctx
    ctx.save()
    ctx.fillStyle = this.palette.grid
    const gap = 30
    for (let x = 0; x < this.width; x += gap) {
      for (let y = 0; y < this.height; y += gap) {
        ctx.beginPath()
        ctx.arc(x, y, 1, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.restore()
  }

  private drawSelection(mark: Mark): void {
    const ctx = this.ctx
    const b = bboxFor(mark)
    ctx.save()
    ctx.strokeStyle = this.palette.selectionStroke
    ctx.setLineDash([4, 4])
    ctx.lineWidth = 1
    ctx.strokeRect(b.minX, b.minY, b.maxX - b.minX, b.maxY - b.minY)
    ctx.setLineDash([])
    ctx.fillStyle = this.palette.selectionHandle
    ctx.fillRect(b.maxX - 5, b.maxY - 5, 10, 10)
    ctx.restore()
  }

  private drawStrokeMark(mark: StrokeMark): void {
    const ctx = this.ctx
    const pts = transformedPoints(mark)
    const paint = mark.color === RAINBOW ? rainbowGradient(ctx, bboxFor(mark)) : mark.color
    ctx.save()
    ctx.globalAlpha = 0.92
    ctx.fillStyle = paint
    ctx.strokeStyle = paint
    drawStrokePath(ctx, pts, mark.width * mark.scale)
    ctx.restore()
  }

  private drawStickerMark(mark: StickerMark): void {
    const img = loadStickerImage(mark.stickerId)
    if (!img || !img.complete || img.naturalWidth === 0) return
    const r = stickerRect(mark)
    this.ctx.drawImage(img, r.minX, r.minY, r.maxX - r.minX, r.maxY - r.minY)
  }

  private render(): void {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.width, this.height)
    this.drawGrid()

    ctx.font = this.font
    ctx.fillStyle = this.palette.text
    ctx.textBaseline = 'alphabetic'
    for (const t of this.textDrawList) ctx.fillText(t.text, t.x, t.y)

    this.marks.forEach((mark) => {
      if (mark.kind === 'stroke') this.drawStrokeMark(mark)
      else this.drawStickerMark(mark)
      if (mark.id === this.selectedId && this.tool === 'select') this.drawSelection(mark)
    })

    const hover = this.hoverPos
    if (this.tool === 'brush' && hover) {
      const r = this.brushSize / 2
      const ringBbox: Bbox = { minX: hover.x - r, minY: hover.y - r, maxX: hover.x + r, maxY: hover.y + r }
      const ringPaint = this.color === RAINBOW ? rainbowGradient(ctx, ringBbox) : this.color
      ctx.save()
      ctx.strokeStyle = ringPaint
      ctx.globalAlpha = 0.55
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.arc(hover.x, hover.y, r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }
  }

  // ---------- history ----------
  private pushHistory(): void {
    this.history.push(structuredClone(this.marks))
    if (this.history.length > 50) this.history.shift()
    this.future = []
  }

  // ---------- pointer handling ----------
  private localPos(e: PointerEvent): Point {
    const r = this.canvas.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  private onPointerDown = (e: PointerEvent): void => {
    const p = this.localPos(e)

    if (this.tool === 'brush') {
      this.pushHistory()
      const mark: StrokeMark = {
        kind: 'stroke',
        id: this.nextId++,
        basePoints: [p],
        centroid: { x: p.x, y: p.y },
        dx: 0,
        dy: 0,
        scale: 1,
        color: this.color,
        width: this.brushSize,
      }
      this.drawing = mark
      this.marks.push(mark)
      this.selectedId = mark.id
      this.canvas.setPointerCapture(e.pointerId)
      this.notify()
      return
    }

    if (this.tool === 'sticker') {
      const img = loadStickerImage(this.selectedStickerId)
      if (!img || !img.complete || img.naturalWidth === 0) return
      this.pushHistory()
      const ratio = img.naturalWidth / img.naturalHeight
      const baseWidth = ratio >= 1 ? STICKER_MAX_DIM : STICKER_MAX_DIM * ratio
      const baseHeight = ratio >= 1 ? STICKER_MAX_DIM / ratio : STICKER_MAX_DIM
      const mark: StickerMark = {
        kind: 'sticker',
        id: this.nextId++,
        centroid: { x: p.x, y: p.y },
        dx: 0,
        dy: 0,
        scale: 1,
        stickerId: this.selectedStickerId,
        baseWidth,
        baseHeight,
      }
      this.marks.push(mark)
      this.selectedId = mark.id
      this.tool = 'select'
      this.markDirty()
      this.notify()
      return
    }

    if (this.tool === 'select') {
      const hit = hitTest(this.marks, this.selectedId, p)
      if (hit && hit.handle) {
        this.pushHistory()
        this.scaleInfo = {
          id: hit.mark.id,
          centroid: computeCentroid(hit.mark),
          startScale: hit.mark.scale,
          startDist: Math.max(6, dist(p, computeCentroid(hit.mark))),
        }
      } else if (hit) {
        this.pushHistory()
        this.selectedId = hit.mark.id
        this.dragInfo = { id: hit.mark.id, startX: p.x, startY: p.y, dx0: hit.mark.dx, dy0: hit.mark.dy }
        this.canvas.setPointerCapture(e.pointerId)
      } else {
        this.selectedId = null
      }
      this.notify()
      this.scheduleFrame()
    }
  }

  private onPointerMove = (e: PointerEvent): void => {
    const p = this.localPos(e)
    this.hoverPos = this.tool === 'brush' ? p : null

    if (this.drawing) {
      this.drawing.basePoints.push(p)
      this.markDirty()
      return
    }

    if (this.dragInfo) {
      const drag = this.dragInfo
      const mark = this.marks.find((x) => x.id === drag.id)
      if (mark) {
        mark.dx = drag.dx0 + (p.x - drag.startX)
        mark.dy = drag.dy0 + (p.y - drag.startY)
      }
      this.markDirty()
      return
    }

    if (this.scaleInfo) {
      const scaleInfo = this.scaleInfo
      const mark = this.marks.find((x) => x.id === scaleInfo.id)
      if (mark) {
        const ratio = dist(p, scaleInfo.centroid) / scaleInfo.startDist
        mark.scale = Math.min(4, Math.max(0.3, scaleInfo.startScale * ratio))
      }
      this.markDirty()
      this.notify()
      return
    }

    this.scheduleFrame()
  }

  private onPointerUp = (): void => {
    this.drawing = null
    this.dragInfo = null
    this.scaleInfo = null
    this.notify()
  }

  private onPointerLeave = (): void => {
    this.hoverPos = null
    this.scheduleFrame()
  }
}
