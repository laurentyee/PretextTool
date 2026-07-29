import { useEffect, useRef, useState } from 'react'
import sourceText from '../assets/source-text.md?raw'
import Stage from './components/Stage'
import Toolbar from './components/Toolbar'
import Footer from './components/Footer'
import HelpModal from './components/HelpModal'
import { useSceneEngine } from './hooks/useSceneEngine'
import { DEFAULT_THEME_ID, THEMES } from './lib/themes'

const THEME_STORAGE_KEY = 'pretext-tool:theme'

function getInitialThemeId(): string {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored && THEMES.some((t) => t.id === stored)) return stored
  } catch {
    // localStorage unavailable (privacy mode, etc.) — fall back below
  }
  return DEFAULT_THEME_ID
}

export default function App() {
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [themeId, setThemeId] = useState<string>(getInitialThemeId)

  const { engine, snapshot } = useSceneEngine(canvasRef, stageRef, sourceText)

  useEffect(() => {
    document.documentElement.dataset.theme = themeId
    engine?.setThemeId()
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeId)
    } catch {
      // ignore
    }
  }, [engine, themeId])

  function cycleTheme() {
    const currentIndex = THEMES.findIndex((t) => t.id === themeId)
    const next = THEMES[(currentIndex + 1) % THEMES.length]
    setThemeId(next.id)
  }

  useEffect(() => {
    if (!engine) return

    function onKeydown(e: KeyboardEvent) {
      if (helpOpen) return
      if (e.key === 'b' || e.key === 'B') engine!.setTool('brush')
      if (e.key === 'v' || e.key === 'V') engine!.setTool('select')
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) engine!.redo()
        else engine!.undo()
      }
    }

    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  }, [engine, helpOpen])

  return (
    <div className="flex h-screen w-screen flex-col bg-ink text-fog">
      <div className="flex min-h-0 flex-1">
        <Toolbar engine={engine} snapshot={snapshot} themeId={themeId} onCycleTheme={cycleTheme} />
        <Stage stageRef={stageRef} canvasRef={canvasRef} />
      </div>
      <Footer onHelp={() => setHelpOpen(true)} />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
}
