import { useEffect, useRef, useState, type RefObject } from 'react'
import { SceneEngine, type SceneSnapshot } from '../lib/sceneEngine'
import { BRUSH_COLORS } from '../lib/tools/brush'
import { DEFAULT_STICKER_ID } from '../lib/tools/stickers'

const DEFAULT_SNAPSHOT: SceneSnapshot = {
  tool: 'brush',
  color: BRUSH_COLORS[0],
  brushSize: 16,
  canUndo: false,
  canRedo: false,
  selectedScale: null,
  stickerId: DEFAULT_STICKER_ID,
  fontFamily: 'mono',
}

export function useSceneEngine(
  canvasRef: RefObject<HTMLCanvasElement>,
  stageRef: RefObject<HTMLDivElement>,
  sourceText: string,
): { engine: SceneEngine | null; snapshot: SceneSnapshot } {
  const engineRef = useRef<SceneEngine | null>(null)
  const [snapshot, setSnapshot] = useState<SceneSnapshot>(DEFAULT_SNAPSHOT)

  useEffect(() => {
    const canvas = canvasRef.current
    const stage = stageRef.current
    if (!canvas || !stage || !sourceText) return

    const engine = new SceneEngine(canvas, stage, sourceText)
    engineRef.current = engine
    setSnapshot(engine.getSnapshot())

    const unsubscribe = engine.subscribe(() => setSnapshot(engine.getSnapshot()))
    const observer = new ResizeObserver(() => engine.resize())
    observer.observe(stage)

    return () => {
      unsubscribe()
      observer.disconnect()
      engine.destroy()
      engineRef.current = null
    }
  }, [canvasRef, stageRef, sourceText])

  return { engine: engineRef.current, snapshot }
}
