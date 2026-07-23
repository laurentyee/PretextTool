import {
  bboxFor,
  computeCentroid,
  dist,
  drawStrokePath,
  hitTest,
  transformedPoints,
  type Doodle,
  type Point,
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

export type Tool = 'brush' | 'select'

export type SceneSnapshot = {
  tool: Tool
  color: string
  brushSize: number
  canUndo: boolean
  selectedScale: number | null
}

export const BRUSH_COLORS = ['#D4FF3D', '#FF5C7A', '#4CC9FF', '#FFD23D']

const FONT_SIZE = 20
const LINE_HEIGHT = 26
export const MONO_FONT_STACK = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
const TEXT_COLOR = 'rgba(201,205,211,0.92)'

type DragInfo = { id: number; startX: number; startY: number; dx0: number; dy0: number }
type ScaleInfo = { id: number; centroid: Point; startScale: number; startDist: number }

export class SceneEngine {
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private readonly maskCanvas: HTMLCanvasElement
  private readonly maskCtx: CanvasRenderingContext2D
  private readonly stage: HTMLElement
  private readonly font = `${FONT_SIZE}px ${MONO_FONT_STACK}`
  private readonly paragraphs: ParagraphState[]

  private dpr = Math.max(1, window.devicePixelRatio || 1)
  private width = 0
  private height = 0

  private tool: Tool = 'brush'
  private color = BRUSH_COLORS[0]
  private brushSize = 16
  private doodles: Doodle[] = []
  private selectedId: number | null = null
  private nextId = 1

  private history: Doodle[][] = []
  private drawing: Doodle | null = null
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

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('2D canvas context unavailable')
    this.ctx = ctx

    this.maskCanvas = document.createElement('canvas')
    const maskCtx = this.maskCanvas.getContext('2d', { willReadFrequently: true })
    if (!maskCtx) throw new Error('2D mask context unavailable')
    this.maskCtx = maskCtx

    this.paragraphs = prepareParagraphs(sourceText, this.font)

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
      this.selectedId !== null ? this.doodles.find((d) => d.id === this.selectedId) ?? null : null
    return {
      tool: this.tool,
      color: this.color,
      brushSize: this.brushSize,
      canUndo: this.history.length > 0,
      selectedScale: this.tool === 'select' && selected ? selected.scale : null,
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
    const d = this.doodles.find((x) => x.id === this.selectedId)
    if (!d) return
    d.scale = scale
    this.markDirty()
    this.notify()
  }

  undo(): void {
    if (this.history.length === 0) return
    this.doodles = this.history.pop() as Doodle[]
    this.selectedId = null
    this.markDirty()
    this.notify()
  }

  clear(): void {
    if (this.doodles.length === 0) return
    this.pushHistory()
    this.doodles = []
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
    this.markDirty()
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
    paintMask(this.maskCtx, this.width, this.height, this.doodles)
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
    this.textDrawList = fillSlotsWithPretext(this.paragraphs, slots)
  }

  private drawGrid(): void {
    const ctx = this.ctx
    ctx.save()
    ctx.fillStyle = 'rgba(255,255,255,0.035)'
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

  private drawSelection(d: Doodle): void {
    const ctx = this.ctx
    const b = bboxFor(d)
    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'
    ctx.setLineDash([4, 4])
    ctx.lineWidth = 1
    ctx.strokeRect(b.minX, b.minY, b.maxX - b.minX, b.maxY - b.minY)
    ctx.setLineDash([])
    ctx.fillStyle = '#fff'
    ctx.fillRect(b.maxX - 5, b.maxY - 5, 10, 10)
    ctx.restore()
  }

  private render(): void {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.width, this.height)
    this.drawGrid()

    ctx.font = this.font
    ctx.fillStyle = TEXT_COLOR
    ctx.textBaseline = 'alphabetic'
    for (const t of this.textDrawList) ctx.fillText(t.text, t.x, t.y)

    this.doodles.forEach((d) => {
      const pts = transformedPoints(d)
      ctx.save()
      ctx.globalAlpha = 0.92
      ctx.fillStyle = d.color
      ctx.strokeStyle = d.color
      drawStrokePath(ctx, pts, d.width * d.scale)
      ctx.restore()
      if (d.id === this.selectedId && this.tool === 'select') this.drawSelection(d)
    })

    const hover = this.hoverPos
    if (this.tool === 'brush' && hover) {
      ctx.save()
      ctx.strokeStyle = this.color
      ctx.globalAlpha = 0.55
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.arc(hover.x, hover.y, this.brushSize / 2, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
      ctx.font = `11px ${MONO_FONT_STACK}`
      ctx.fillStyle = 'rgba(201,205,211,0.5)'
      ctx.fillText(
        `${Math.round(hover.x)}, ${Math.round(hover.y)}  ⌀${this.brushSize}`,
        hover.x + this.brushSize / 2 + 10,
        hover.y + 4,
      )
    }
  }

  // ---------- history ----------
  private pushHistory(): void {
    this.history.push(structuredClone(this.doodles))
    if (this.history.length > 50) this.history.shift()
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
      const doodle: Doodle = {
        id: this.nextId++,
        basePoints: [p],
        centroid: { x: p.x, y: p.y },
        dx: 0,
        dy: 0,
        scale: 1,
        color: this.color,
        width: this.brushSize,
      }
      this.drawing = doodle
      this.doodles.push(doodle)
      this.selectedId = doodle.id
      this.canvas.setPointerCapture(e.pointerId)
      this.notify()
      return
    }

    if (this.tool === 'select') {
      const hit = hitTest(this.doodles, this.selectedId, p)
      if (hit && hit.handle) {
        this.pushHistory()
        this.scaleInfo = {
          id: hit.doodle.id,
          centroid: computeCentroid(hit.doodle),
          startScale: hit.doodle.scale,
          startDist: Math.max(6, dist(p, computeCentroid(hit.doodle))),
        }
      } else if (hit) {
        this.pushHistory()
        this.selectedId = hit.doodle.id
        this.dragInfo = { id: hit.doodle.id, startX: p.x, startY: p.y, dx0: hit.doodle.dx, dy0: hit.doodle.dy }
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
      const d = this.doodles.find((x) => x.id === drag.id)
      if (d) {
        d.dx = drag.dx0 + (p.x - drag.startX)
        d.dy = drag.dy0 + (p.y - drag.startY)
      }
      this.markDirty()
      return
    }

    if (this.scaleInfo) {
      const scaleInfo = this.scaleInfo
      const d = this.doodles.find((x) => x.id === scaleInfo.id)
      if (d) {
        const ratio = dist(p, scaleInfo.centroid) / scaleInfo.startDist
        d.scale = Math.min(4, Math.max(0.3, scaleInfo.startScale * ratio))
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
