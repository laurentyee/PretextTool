import { type Mark, type Point, type ScatterMark, type StrokeMark } from './doodleGeometry'
import {
  computeSlots,
  fillSlotsWithPretext,
  paintMask,
  prepareParagraphs,
  resetParagraphs,
  type ParagraphState,
  type TextDraw,
} from './textFlow'
import { BRUSH_COLORS, createBrushMark, drawBrushHoverRing, drawBrushMark } from './tools/brush'
import { createScatterMark, drawScatterMark, spawnScatterBars } from './tools/scatter'
import { applyDrag, applyScale, beginDrag, beginScale, drawSelection, hitTest, type DragInfo, type ScaleInfo } from './tools/select'
import { createStickerMark, drawStickerMark } from './tools/sticker'
import { DEFAULT_STICKER_ID, loadStickerImage, STICKERS } from './tools/stickers'
import { FONT_STACKS, type FontFamily } from './fonts'
import { DEFAULT_THEME_ID, getThemeDef } from './themes'

export type Tool = 'brush' | 'select' | 'sticker' | 'scatter'
export type { FontFamily }

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

const FONT_SIZE = 14
const LINE_HEIGHT = 26

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
  private drawing: StrokeMark | ScatterMark | null = null
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

  private render(): void {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.width, this.height)
    this.drawGrid()

    ctx.font = this.font
    ctx.fillStyle = this.palette.text
    ctx.textBaseline = 'alphabetic'
    for (const t of this.textDrawList) ctx.fillText(t.text, t.x, t.y)

    this.marks.forEach((mark) => {
      if (mark.kind === 'stroke') drawBrushMark(ctx, mark)
      else if (mark.kind === 'scatter') drawScatterMark(ctx, mark)
      else drawStickerMark(ctx, mark)
      if (mark.id === this.selectedId && this.tool === 'select') drawSelection(ctx, mark, this.palette)
    })

    if (this.tool === 'brush' && this.hoverPos) {
      drawBrushHoverRing(ctx, this.hoverPos, this.brushSize, this.color)
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
      const mark = createBrushMark(this.nextId++, p, this.color, this.brushSize)
      this.drawing = mark
      this.marks.push(mark)
      this.selectedId = mark.id
      this.canvas.setPointerCapture(e.pointerId)
      this.notify()
      return
    }

    if (this.tool === 'scatter') {
      this.pushHistory()
      const mark = createScatterMark(this.nextId++, p, this.brushSize)
      this.drawing = mark
      this.marks.push(mark)
      this.selectedId = mark.id
      this.canvas.setPointerCapture(e.pointerId)
      this.notify()
      return
    }

    if (this.tool === 'sticker') {
      const mark = createStickerMark(this.nextId, p, this.selectedStickerId)
      if (!mark) return
      this.nextId++
      this.pushHistory()
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
        this.scaleInfo = beginScale(hit.mark, p)
      } else if (hit) {
        this.pushHistory()
        this.selectedId = hit.mark.id
        this.dragInfo = beginDrag(hit.mark, p)
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
      const prev = this.drawing.basePoints[this.drawing.basePoints.length - 1]
      this.drawing.basePoints.push(p)
      if (this.drawing.kind === 'scatter') spawnScatterBars(this.drawing, prev, p, this.brushSize)
      this.markDirty()
      return
    }

    if (this.dragInfo) {
      const drag = this.dragInfo
      const mark = this.marks.find((x) => x.id === drag.id)
      if (mark) applyDrag(mark, drag, p)
      this.markDirty()
      return
    }

    if (this.scaleInfo) {
      const scaleInfo = this.scaleInfo
      const mark = this.marks.find((x) => x.id === scaleInfo.id)
      if (mark) applyScale(mark, scaleInfo, p)
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
