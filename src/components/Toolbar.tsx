import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { type SceneEngine, type SceneSnapshot } from '../lib/sceneEngine'
import { FONT_FAMILY_OPTIONS } from '../lib/tools/fontSwap'
import { THEMES } from '../lib/themes'
import { cx } from '../lib/utils/cx'
import ToolFlyout from './ToolFlyout'

import brushIconLightUrl from '../../assets/icons/light-icons/Brush.svg'
import transformIconLightUrl from '../../assets/icons/light-icons/Transform.svg'
import imageIconLightUrl from '../../assets/icons/light-icons/Image.svg'
import undoIconLightUrl from '../../assets/icons/light-icons/Undo.svg'
import redoIconLightUrl from '../../assets/icons/light-icons/Redo.svg'
import trashIconLightUrl from '../../assets/icons/light-icons/Trash.svg'
import themeSwapIconLightUrl from '../../assets/icons/light-icons/Theme-Swap.svg'
import fontSwapIconLightUrl from '../../assets/icons/light-icons/Font-Swap.svg'

import brushIconDarkUrl from '../../assets/icons/dark-icons/Brush-Dark.svg'
import transformIconDarkUrl from '../../assets/icons/dark-icons/Transform-Dark.svg'
import imageIconDarkUrl from '../../assets/icons/dark-icons/Image-Dark.svg'
import undoIconDarkUrl from '../../assets/icons/dark-icons/Undo-Dark.svg'
import redoIconDarkUrl from '../../assets/icons/dark-icons/Redo-Dark.svg'
import trashIconDarkUrl from '../../assets/icons/dark-icons/Trash-Dark.svg'
import themeSwapIconDarkUrl from '../../assets/icons/dark-icons/Theme-Swap-Dark.svg'
import fontSwapIconDarkUrl from '../../assets/icons/dark-icons/Font-Swap-Dark.svg'

type ToolbarProps = {
  engine: SceneEngine | null
  snapshot: SceneSnapshot
  themeId: string
  onCycleTheme: () => void
}

// Base (scale = 1) sizes. The whole toolbar scales up/down from these to fit
// the available column height — see the scale-factor effect in Toolbar().
const LARGE_ICON = 54
const LARGE_BOX = 75
const SMALL_ICON = 36
const SMALL_BOX = 54
const CARD_PAD_BASE = 12
const INNER_GAP_BASE = 10
const ASIDE_WIDTH_BASE = 120

// 3 cards' content height at scale 1: (3*75 + 2*10 + 2*12) + (3*54 + 2*10 + 2*12) + (2*54 + 1*10 + 2*12)
const BASE_CARDS_HEIGHT = 269 + 206 + 142
const GAP_TARGET = 30 // preferred card-to-card gap, middle of the 24-36 band
const GAP_MAX = 36
const SCALE_MIN = 0.6
const SCALE_MAX = 1.3

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
        active && activeStyle === 'ring' && 'bg-iconbox border-accent/60 shadow-[0_0_0_2px_rgba(64,160,205,0.25)]',
      )}
    >
      <img src={iconUrl} alt="" width={iconSize} height={iconSize} className="block" />
    </button>
  )
}

function ToolCard({ pad, gap, children }: { pad: number; gap: number; children: ReactNode }) {
  return (
    <div className="flex flex-none flex-col items-center rounded-xl bg-panel" style={{ padding: pad, gap }}>
      {children}
    </div>
  )
}

export default function Toolbar({ engine, snapshot, themeId, onCycleTheme }: ToolbarProps) {
  const currentTheme = THEMES.find((t) => t.id === themeId) ?? THEMES[0]
  const nextTheme = THEMES[(THEMES.findIndex((t) => t.id === themeId) + 1) % THEMES.length]

  // Dark theme needs light-colored (cream) icon art for contrast; light theme needs
  // the dark-colored variant — the folder names describe the icon's own ink color.
  const isDark = themeId === 'dark'
  const brushIconUrl = isDark ? brushIconLightUrl : brushIconDarkUrl
  const transformIconUrl = isDark ? transformIconLightUrl : transformIconDarkUrl
  const imageIconUrl = isDark ? imageIconLightUrl : imageIconDarkUrl
  const undoIconUrl = isDark ? undoIconLightUrl : undoIconDarkUrl
  const redoIconUrl = isDark ? redoIconLightUrl : redoIconDarkUrl
  const trashIconUrl = isDark ? trashIconLightUrl : trashIconDarkUrl
  const themeSwapIconUrl = isDark ? themeSwapIconLightUrl : themeSwapIconDarkUrl
  const fontSwapIconUrl = isDark ? fontSwapIconLightUrl : fontSwapIconDarkUrl

  const currentFontIndex = FONT_FAMILY_OPTIONS.findIndex((o) => o.id === snapshot.fontFamily)
  const currentFont = FONT_FAMILY_OPTIONS[Math.max(currentFontIndex, 0)]
  const nextFont = FONT_FAMILY_OPTIONS[(Math.max(currentFontIndex, 0) + 1) % FONT_FAMILY_OPTIONS.length]

  const iconRefs = useRef<Partial<Record<'brush' | 'sticker', HTMLButtonElement>>>({})
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const [flyoutClosed, setFlyoutClosed] = useState(false)
  const cardsWrapperRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [cardGap, setCardGap] = useState(GAP_TARGET)

  useEffect(() => {
    setFlyoutClosed(false)
  }, [snapshot.tool])

  useLayoutEffect(() => {
    function update() {
      const available = cardsWrapperRef.current?.clientHeight ?? 0
      const rawScale = (available - 2 * GAP_TARGET) / BASE_CARDS_HEIGHT
      const s = Math.max(SCALE_MIN, Math.min(SCALE_MAX, rawScale))
      setScale(s)
      const rawGap = (available - s * BASE_CARDS_HEIGHT) / 2
      setCardGap(Math.max(0, Math.min(GAP_MAX, rawGap)))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const large = { icon: Math.round(LARGE_ICON * scale), box: Math.round(LARGE_BOX * scale) }
  const small = { icon: Math.round(SMALL_ICON * scale), box: Math.round(SMALL_BOX * scale) }
  const cardPad = Math.round(CARD_PAD_BASE * scale)
  const innerGap = Math.round(INNER_GAP_BASE * scale)

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
    <aside
      className="flex flex-none select-none flex-col items-start bg-ink py-5 pl-3"
      style={{ width: ASIDE_WIDTH_BASE * scale }}
    >
      <div
        ref={cardsWrapperRef}
        className="flex w-full min-h-0 flex-1 flex-col items-start justify-center"
        style={{ gap: cardGap }}
      >
        <ToolCard pad={cardPad} gap={innerGap}>
          <IconButton
            title="Brush (B)"
            ariaLabel="Brush tool"
            iconUrl={brushIconUrl}
            iconSize={large.icon}
            boxSize={large.box}
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
            iconSize={large.icon}
            boxSize={large.box}
            active={snapshot.tool === 'select'}
            onClick={() => engine?.setTool('select')}
          />
          <IconButton
            title="Sticker"
            ariaLabel="Sticker tool"
            iconUrl={imageIconUrl}
            iconSize={large.icon}
            boxSize={large.box}
            active={snapshot.tool === 'sticker'}
            activeStyle="accent"
            boxRef={(el) => {
              iconRefs.current.sticker = el ?? undefined
            }}
            onClick={() => (snapshot.tool === 'sticker' ? setFlyoutClosed((c) => !c) : engine?.setTool('sticker'))}
          />
        </ToolCard>

        <ToolCard pad={cardPad} gap={innerGap}>
          <IconButton
            title="Undo (⌘Z)"
            ariaLabel="Undo"
            iconUrl={undoIconUrl}
            iconSize={small.icon}
            boxSize={small.box}
            disabled={!snapshot.canUndo}
            onClick={() => engine?.undo()}
          />
          <IconButton
            title="Redo (⌘⇧Z)"
            ariaLabel="Redo"
            iconUrl={redoIconUrl}
            iconSize={small.icon}
            boxSize={small.box}
            disabled={!snapshot.canRedo}
            onClick={() => engine?.redo()}
          />
          <IconButton
            title="Clear canvas"
            ariaLabel="Clear canvas"
            iconUrl={trashIconUrl}
            iconSize={small.icon}
            boxSize={small.box}
            onClick={() => engine?.clear()}
          />
        </ToolCard>

        <ToolCard pad={cardPad} gap={innerGap}>
          <IconButton
            title={`Theme: ${currentTheme.label} (click for ${nextTheme.label})`}
            ariaLabel="Cycle theme"
            iconUrl={themeSwapIconUrl}
            iconSize={small.icon}
            boxSize={small.box}
            onClick={onCycleTheme}
          />
          <IconButton
            title={`Font: ${currentFont.label} (click for ${nextFont.label})`}
            ariaLabel="Cycle font family"
            iconUrl={fontSwapIconUrl}
            iconSize={small.icon}
            boxSize={small.box}
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

      <ToolFlyout
        engine={engine}
        snapshot={snapshot}
        anchorRect={anchorRect}
        closed={flyoutClosed}
        onPick={() => setFlyoutClosed(true)}
      />
    </aside>
  )
}
