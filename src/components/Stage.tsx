import type { RefObject } from 'react'

type StageProps = {
  stageRef: RefObject<HTMLDivElement>
  canvasRef: RefObject<HTMLCanvasElement>
}

export default function Stage({ stageRef, canvasRef }: StageProps) {
  return (
    <main ref={stageRef} className="relative flex-1 overflow-hidden bg-ink">
      <canvas ref={canvasRef} className="block touch-none" />
    </main>
  )
}
