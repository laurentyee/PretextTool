import { useMemo, useState } from 'react'
import textSource from '../source-text.md'

function App() {
  const [hasModal, setHasModal] = useState(true)
  const text = useMemo(() => textSource.trim(), [])

  return (
    <div className="min-h-screen bg-canvas text-slate-100">
      {hasModal && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/90 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-600 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950">
            <h1 className="text-3xl font-semibold text-slate-50">PretextTool</h1>
            <p className="mt-4 text-slate-300">Draw with the brush, move shapes, and watch text flow around them.</p>
            <button
              className="mt-8 inline-flex rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-300"
              onClick={() => setHasModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="grid min-h-screen grid-cols-[280px_1fr] gap-6 p-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-[32px] border border-slate-700 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Toolbar</h2>
              <p className="mt-2 text-sm text-slate-400">Start with brush, move shapes, and clear canvas.</p>
            </div>
            <button className="w-full rounded-2xl bg-slate-800 px-4 py-3 text-left text-slate-100 transition hover:bg-slate-700">Brush</button>
            <button className="w-full rounded-2xl bg-slate-800 px-4 py-3 text-left text-slate-100 transition hover:bg-slate-700">Drag</button>
            <button className="w-full rounded-2xl bg-slate-800 px-4 py-3 text-left text-slate-100 transition hover:bg-slate-700">Undo</button>
            <button className="w-full rounded-2xl bg-slate-800 px-4 py-3 text-left text-slate-100 transition hover:bg-slate-700">Clear</button>
            <button className="w-full rounded-2xl bg-slate-800 px-4 py-3 text-left text-slate-100 transition hover:bg-slate-700">Help</button>
          </div>
        </aside>

        <main className="rounded-[36px] border border-slate-700 bg-slate-950/80 p-8 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
          <div className="h-full rounded-[32px] border border-slate-800 bg-slate-950/90 p-8 text-base leading-8 text-slate-200">
            <div className="prose prose-invert max-w-none font-mono text-[20px] leading-[1.9]">
              {text.split('\n').map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
