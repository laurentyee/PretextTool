import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { type SceneEngine, type SceneSnapshot } from '../lib/sceneEngine'
import { FONT_FAMILY_OPTIONS } from '../lib/tools/fontSwap'
import { THEMES } from '../lib/themes'
import { cx } from '../lib/utils/cx'
import ToolFlyout from './ToolFlyout'

import brushIconUrl from '../../assets/icons/Brush.svg'
import transformIconUrl from '../../assets/icons/Transform.svg'
import imageIconUrl from '../../assets/icons/Image.svg'
import undoIconUrl from '../../assets/icons/Undo.svg'
import redoIconUrl from '../../assets/icons/Redo.svg'
import trashIconUrl from '../../assets/icons/Trash.svg'
import themeSwapIconUrl from '../../assets/icons/Theme-Swap.svg'
import fontSwapIconUrl from '../../assets/icons/Font-Swap.svg'

type ToolbarProps = {
  engine: SceneEngine | null
  snapshot: SceneSnapshot
  themeId: string
  onCycleTheme: () => void
}

// Cards shrink-wrap: constant padding around the box(es), so a card holding
// smaller icons is narrower — they line up flush via items-start, not by
// sharing one fixed width.
const CARD_PAD = 8

type IconButtonProps = {
  title: string
  ariaLabel: string
  iconUrl: string
  iconSize: number
  boxSize: number
  active?: boolean
  activeStyle?: 'accent' | 'ring'
  disabled?: boolean
  onClick: () => void
  boxRef?: (el: HTMLButtonElement | null) => void
}

function IconButton({
  title,
  ariaLabel,
  iconUrl,
  iconSize,
  boxSize,
  active,
  activeStyle = 'ring',
  disabled,
  onClick,
  boxRef,
}: IconButtonProps) {
  return (
    <button
      ref={boxRef}
      type="button"
      title={title}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      style={{ height: boxSize, width: boxSize }}
      className={cx(
        'flex flex-none items-center justify-center rounded-xl border border-transparent transition-colors duration-100 hover:brightness-110 disabled:opacity-30 disabled:hover:brightness-100',
        !active && 'bg-iconbox',
        active && activeStyle === 'accent' && 'bg-accent',
        active && activeStyle === 'ring' && 'bg-iconbox border-lime/60 shadow-[0_0_0_2px_rgba(212,255,61,0.15)]',
      )}
    >
      <img src={iconUrl} alt="" width={iconSize} height={iconSize} className="block" />
    </button>
  )
}

function ToolCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-none flex-col items-center gap-1.5 rounded-xl bg-panel" style={{ padding: CARD_PAD }}>
      {children}
    </div>
  )
}

export default function Toolbar({ engine, snapshot, themeId, onCycleTheme }: ToolbarProps) {
  const currentTheme = THEMES.find((t) => t.id === themeId) ?? THEMES[0]
  const nextTheme = THEMES[(THEMES.findIndex((t) => t.id === themeId) + 1) % THEMES.length]

  const currentFontIndex = FONT_FAMILY_OPTIONS.findIndex((o) => o.id === snapshot.fontFamily)
  const currentFont = FONT_FAMILY_OPTIONS[Math.max(currentFontIndex, 0)]
  const nextFont = FONT_FAMILY_OPTIONS[(Math.max(currentFontIndex, 0) + 1) % FONT_FAMILY_OPTIONS.length]

  const iconRefs = useRef<Partial<Record<'brush' | 'sticker', HTMLButtonElement>>>({})
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const [flyoutClosed, setFlyoutClosed] = useState(false)

  useEffect(() => {
    setFlyoutClosed(false)
  }, [snapshot.tool])

  useLayoutEffect(() => {
    const key = snapshot.tool === 'brush' || snapshot.tool === 'sticker' ? snapshot.tool : null
    function update() {
      const el = key ? iconRefs.current[key] : null
      setAnchorRect(el ? el.getBoundingClientRect() : null)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [snapshot.tool])

  return (
    <aside className="flex w-[84px] flex-none select-none flex-col items-start bg-ink py-3 pl-2">
      <div className="flex w-full flex-1 flex-col items-start justify-between gap-1.5">
        <ToolCard>
          <IconButton
            title="Brush (B)"
            ariaLabel="Brush tool"
            iconUrl={brushIconUrl}
            iconSize={36}
            boxSize={50}
            active={snapshot.tool === 'brush'}
            activeStyle="accent"
            boxRef={(el) => {
              iconRefs.current.brush = el ?? undefined
            }}
            onClick={() => (snapshot.tool === 'brush' ? setFlyoutClosed((c) => !c) : engine?.setTool('brush'))}
          />
          <IconButton
            title="Select / Move (V)"
            ariaLabel="Select and move tool"
            iconUrl={transformIconUrl}
            iconSize={36}
            boxSize={50}
            active={snapshot.tool === 'select'}
            onClick={() => engine?.setTool('select')}
          />
          <IconButton
            title="Sticker"
            ariaLabel="Sticker tool"
            iconUrl={imageIconUrl}
            iconSize={36}
            boxSize={50}
            active={snapshot.tool === 'sticker'}
            activeStyle="accent"
            boxRef={(el) => {
              iconRefs.current.sticker = el ?? undefined
            }}
            onClick={() => (snapshot.tool === 'sticker' ? setFlyoutClosed((c) => !c) : engine?.setTool('sticker'))}
          />
        </ToolCard>

        <ToolCard>
          <IconButton
            title="Undo (⌘Z)"
            ariaLabel="Undo"
            iconUrl={undoIconUrl}
            iconSize={24}
            boxSize={36}
            disabled={!snapshot.canUndo}
            onClick={() => engine?.undo()}
          />
          <IconButton
            title="Redo (⌘⇧Z)"
            ariaLabel="Redo"
            iconUrl={redoIconUrl}
            iconSize={24}
            boxSize={36}
            disabled={!snapshot.canRedo}
            onClick={() => engine?.redo()}
          />
          <IconButton
            title="Clear canvas"
            ariaLabel="Clear canvas"
            iconUrl={trashIconUrl}
            iconSize={24}
            boxSize={36}
            onClick={() => engine?.clear()}
          />
        </ToolCard>

        <ToolCard>
          <IconButton
            title={`Theme: ${currentTheme.label} (click for ${nextTheme.label})`}
            ariaLabel="Cycle theme"
            iconUrl={themeSwapIconUrl}
            iconSize={24}
            boxSize={36}
            onClick={onCycleTheme}
          />
          <IconButton
            title={`Font: ${currentFont.label} (click for ${nextFont.label})`}
            ariaLabel="Cycle font family"
            iconUrl={fontSwapIconUrl}
            iconSize={24}
            boxSize={36}
            onClick={() => engine?.setFontFamily(nextFont.id)}
          />
        </ToolCard>
      </div>

      {snapshot.tool === 'select' && snapshot.selectedScale !== null && (
        <div className="mt-1.5 flex w-full flex-col items-center gap-2.5">
          <div className="text-[9px] uppercase tracking-[0.08em] text-fog/50">scale</div>
          <input
            type="range"
            min={30}
            max={400}
            value={Math.round(snapshot.selectedScale * 100)}
            onChange={(e) => engine?.setSelectedScale(Number(e.target.value) / 100)}
            className="w-[52px] cursor-pointer"
          />
        </div>
      )}

      <ToolFlyout engine={engine} snapshot={snapshot} anchorRect={anchorRect} closed={flyoutClosed} />
    </aside>
  )
}
