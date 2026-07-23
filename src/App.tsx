import { useEffect, useRef, useState } from 'react'
import sourceText from '../source-text.md?raw'
import Stage from './components/Stage'
import Toolbar from './components/Toolbar'
import HelpModal from './components/HelpModal'
import { useSceneEngine } from './hooks/useSceneEngine'

export default function App() {
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [helpOpen, setHelpOpen] = useState(true)

  const { engine, snapshot } = useSceneEngine(canvasRef, stageRef, sourceText)

  useEffect(() => {
    if (!engine) return

    function onKeydown(e: KeyboardEvent) {
      if (helpOpen) return
      if (e.key === 'b' || e.key === 'B') engine!.setTool('brush')
      if (e.key === 'v' || e.key === 'V') engine!.setTool('select')
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        engine!.undo()
      }
    }

    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  }, [engine, helpOpen])

  return (
    <div className="flex h-screen w-screen bg-ink text-fog">
      <Toolbar engine={engine} snapshot={snapshot} onHelp={() => setHelpOpen(true)} />
      <Stage stageRef={stageRef} canvasRef={canvasRef} />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
}
