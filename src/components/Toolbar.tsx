import { type SceneEngine, type SceneSnapshot } from '../lib/sceneEngine'
import { FONT_FAMILY_OPTIONS, fontStack } from '../lib/tools/fontSwap'
import { BRUSH_COLORS, RAINBOW } from '../lib/tools/brush'
import { STICKERS } from '../lib/tools/stickers'
import { THEMES } from '../lib/themes'
import { cx } from '../lib/cx'

type ToolbarProps = {
  engine: SceneEngine | null
  snapshot: SceneSnapshot
  onHelp: () => void
  themeId: string
  onCycleTheme: () => void
}

const toolButtonBase =
  'flex h-[42px] w-[42px] items-center justify-center rounded-[11px] border border-transparent text-fog transition-colors duration-100 hover:bg-white/[0.06] disabled:opacity-30 disabled:hover:bg-transparent'
const toolButtonActive = 'bg-lime/10 border-lime/45 text-lime'
const iconClass = 'h-[19px] w-[19px]'

export default function Toolbar({ engine, snapshot, onHelp, themeId, onCycleTheme }: ToolbarProps) {
  const currentTheme = THEMES.find((t) => t.id === themeId) ?? THEMES[0]
  const nextTheme = THEMES[(THEMES.findIndex((t) => t.id === themeId) + 1) % THEMES.length]
  return (
    <aside className="flex w-[84px] flex-none select-none flex-col items-center gap-2 border-r border-line bg-panel py-[18px]">
      <div className="mb-2.5 font-serif text-[14px] italic tracking-wide text-fog/75">
        sb<span className="not-italic text-lime/90">/</span>pt
      </div>

      <button
        type="button"
        title="Brush (B)"
        aria-label="Brush tool"
        className={cx(toolButtonBase, snapshot.tool === 'brush' && toolButtonActive)}
        onClick={() => engine?.setTool('brush')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
          <path d="M9.5 14.5 3 21l1.2-4.8L14.5 5.9a2.1 2.1 0 0 1 3 0l.6.6a2.1 2.1 0 0 1 0 3L8.3 19.3" />
          <path d="M14.5 5.9 18.1 9.5" />
        </svg>
      </button>

      <button
        type="button"
        title="Select / Move (V)"
        aria-label="Select and move tool"
        className={cx(toolButtonBase, snapshot.tool === 'select' && toolButtonActive)}
        onClick={() => engine?.setTool('select')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
          <path d="M5 3l14 6-6 2-2 6-6-14z" />
        </svg>
      </button>

      <button
        type="button"
        title="Sticker"
        aria-label="Sticker tool"
        className={cx(toolButtonBase, snapshot.tool === 'sticker' && toolButtonActive)}
        onClick={() => engine?.setTool('sticker')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
          <rect x={3} y={4} width={18} height={16} rx={2} />
          <circle cx={8.5} cy={9.5} r={1.5} />
          <path d="M21 15l-5-5-4 4-3-3-6 6" />
        </svg>
      </button>

      <button
        type="button"
        title="Scatter"
        aria-label="Scatter brush tool"
        className={cx(toolButtonBase, snapshot.tool === 'scatter' && toolButtonActive)}
        onClick={() => engine?.setTool('scatter')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
          <path d="M11 4v5" />
          <path d="M17 3v3" />
          <path d="M5 8v4" />
          <path d="M14 12v6" />
          <path d="M8 14v4" />
          <path d="M18 15v3" />
        </svg>
      </button>

      <div className="my-1.5 h-px w-[30px] bg-line" />

      <button
        type="button"
        title="Undo (⌘Z)"
        aria-label="Undo"
        disabled={!snapshot.canUndo}
        className={toolButtonBase}
        onClick={() => engine?.undo()}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
          <path d="M4 9h11a5 5 0 0 1 0 10H9" />
          <path d="M8 5 4 9l4 4" />
        </svg>
      </button>

      <button
        type="button"
        title="Redo (⌘⇧Z)"
        aria-label="Redo"
        disabled={!snapshot.canRedo}
        className={toolButtonBase}
        onClick={() => engine?.redo()}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
          <path d="M20 9H9a5 5 0 0 0 0 10h6" />
          <path d="M16 5l4 4-4 4" />
        </svg>
      </button>

      <button
        type="button"
        title="Clear canvas"
        aria-label="Clear canvas"
        className={toolButtonBase}
        onClick={() => engine?.clear()}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
          <path d="M4 7h16" />
          <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
        </svg>
      </button>

      <div className="my-1.5 h-px w-[30px] bg-line" />

      <button
        type="button"
        title={`Theme: ${currentTheme.label} (click for ${nextTheme.label})`}
        aria-label="Cycle theme"
        className={toolButtonBase}
        onClick={onCycleTheme}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
          <circle cx={12} cy={12} r={4.5} />
          <path d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12H5M19 12h2.5M4.2 19.8 6 18M18 6l1.8-1.8" />
        </svg>
      </button>

      <div className="flex gap-1">
        {FONT_FAMILY_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            title={opt.label}
            aria-label={`Use ${opt.label} font`}
            onClick={() => engine?.setFontFamily(opt.id)}
            style={{ fontFamily: fontStack(opt.id) }}
            className={cx(
              'flex h-6 w-6 items-center justify-center rounded-md border border-transparent text-[11px] text-fog transition-colors duration-100 hover:bg-white/[0.06]',
              snapshot.fontFamily === opt.id && toolButtonActive,
            )}
          >
            Aa
          </button>
        ))}
      </div>

      <div className="mt-0.5 flex min-h-[20px] flex-col items-center gap-2.5">
        {snapshot.tool === 'brush' && (
          <div className="flex flex-col gap-[7px]">
            {BRUSH_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                aria-label={`Set brush color ${c}`}
                onClick={() => engine?.setColor(c)}
                style={{ background: c }}
                className={cx(
                  'h-[22px] w-[22px] cursor-pointer rounded-full border-2 border-white/15 p-0',
                  c === snapshot.color && 'border-white shadow-[0_0_0_2px_rgba(255,255,255,0.15)]',
                )}
              />
            ))}
            <button
              type="button"
              title="Rainbow"
              aria-label="Set brush color rainbow"
              onClick={() => engine?.setColor(RAINBOW)}
              className={cx(
                'h-[22px] w-[22px] cursor-pointer rounded-full border-2 border-white/15 bg-gradient-to-br from-red-500 via-yellow-300 to-fuchsia-500 p-0',
                snapshot.color === RAINBOW && 'border-white shadow-[0_0_0_2px_rgba(255,255,255,0.15)]',
              )}
            />
          </div>
        )}

        {(snapshot.tool === 'brush' || snapshot.tool === 'scatter') && (
          <>
            <div className="text-[9px] uppercase tracking-[0.08em] text-fog/50">size</div>
            <input
              type="range"
              min={6}
              max={48}
              value={snapshot.brushSize}
              onChange={(e) => engine?.setBrushSize(Number(e.target.value))}
              className="w-[52px] cursor-pointer"
            />
          </>
        )}

        {snapshot.tool === 'sticker' && (
          <div className="flex flex-col gap-[7px]">
            {STICKERS.map((s) => (
              <button
                key={s.id}
                type="button"
                title={s.label}
                aria-label={`Use sticker ${s.label}`}
                onClick={() => engine?.setStickerId(s.id)}
                className={cx(
                  'h-7 w-7 cursor-pointer overflow-hidden rounded-md border-2 border-white/15 p-0',
                  s.id === snapshot.stickerId && 'border-white shadow-[0_0_0_2px_rgba(255,255,255,0.15)]',
                )}
              >
                <img src={s.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {snapshot.tool === 'select' && snapshot.selectedScale !== null && (
          <>
            <div className="text-[9px] uppercase tracking-[0.08em] text-fog/50">scale</div>
            <input
              type="range"
              min={30}
              max={400}
              value={Math.round(snapshot.selectedScale * 100)}
              onChange={(e) => engine?.setSelectedScale(Number(e.target.value) / 100)}
              className="w-[52px] cursor-pointer"
            />
          </>
        )}
      </div>

      <div className="flex-1" />

      <button type="button" title="Help" aria-label="Help" className={toolButtonBase} onClick={onHelp}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
          <circle cx={12} cy={12} r={9} />
          <path d="M9.5 9.2a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 1.7-2.4 3.5" />
          <circle cx={12} cy={17} r={0.6} fill="currentColor" stroke="none" />
        </svg>
      </button>
    </aside>
  )
}
