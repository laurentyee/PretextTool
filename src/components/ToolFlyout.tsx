import { type SceneEngine, type SceneSnapshot } from '../lib/sceneEngine'
import { gradientCssPreview } from '../lib/tools/brush'
import { STICKERS } from '../lib/tools/sticker'
import { cx } from '../lib/utils/cx'

type ToolFlyoutProps = {
  engine: SceneEngine | null
  snapshot: SceneSnapshot
  anchorRect: DOMRect | null
  closed: boolean
}

const FLYOUT_GAP = 10
const NUB = 12

const LABELS = { brush: 'BRUSH', sticker: 'IMAGE' } as const

export default function ToolFlyout({ engine, snapshot, anchorRect, closed }: ToolFlyoutProps) {
  const open = (snapshot.tool === 'brush' || snapshot.tool === 'sticker') && !closed
  if (!open || !anchorRect) return null

  return (
    <div
      className="fixed z-30 flex flex-col items-center gap-2.5 rounded-xl bg-panel p-3 shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
      style={{ top: anchorRect.top, left: anchorRect.right + FLYOUT_GAP }}
    >
      <div
        className="absolute rotate-45 bg-panel"
        style={{ left: -NUB / 2, top: anchorRect.height / 2 - NUB / 2, width: NUB, height: NUB }}
      />
      <div className="text-[9px] uppercase tracking-[0.08em] text-fog/50">{LABELS[snapshot.tool as 'brush' | 'sticker']}</div>

      {snapshot.tool === 'brush' && (
        <>
          <div className="flex flex-col gap-[7px]">
            <button
              type="button"
              title="Rainbow"
              aria-label="Set brush gradient rainbow"
              onClick={() => engine?.setColor('rainbow')}
              style={{ background: gradientCssPreview('rainbow') }}
              className={cx(
                'h-[22px] w-[22px] cursor-pointer rounded-full border-2 border-white/15 p-0',
                snapshot.color === 'rainbow' && 'border-white shadow-[0_0_0_2px_rgba(255,255,255,0.15)]',
              )}
            />
            <button
              type="button"
              title="Warm"
              aria-label="Set brush gradient warm"
              onClick={() => engine?.setColor('warm')}
              style={{ background: gradientCssPreview('warm') }}
              className={cx(
                'h-[22px] w-[22px] cursor-pointer rounded-full border-2 border-white/15 p-0',
                snapshot.color === 'warm' && 'border-white shadow-[0_0_0_2px_rgba(255,255,255,0.15)]',
              )}
            />
            <button
              type="button"
              title="Monet"
              aria-label="Set brush gradient monet"
              onClick={() => engine?.setColor('monet')}
              style={{ background: gradientCssPreview('monet') }}
              className={cx(
                'h-[22px] w-[22px] cursor-pointer rounded-full border-2 border-white/15 p-0',
                snapshot.color === 'monet' && 'border-white shadow-[0_0_0_2px_rgba(255,255,255,0.15)]',
              )}
            />
            <button
              type="button"
              title="Candy"
              aria-label="Set brush gradient candy"
              onClick={() => engine?.setColor('candy')}
              style={{ background: gradientCssPreview('candy') }}
              className={cx(
                'h-[22px] w-[22px] cursor-pointer rounded-full border-2 border-white/15 p-0',
                snapshot.color === 'candy' && 'border-white shadow-[0_0_0_2px_rgba(255,255,255,0.15)]',
              )}
            />
            <button
              type="button"
              title="Citrus"
              aria-label="Set brush gradient citrus"
              onClick={() => engine?.setColor('citrus')}
              style={{ background: gradientCssPreview('citrus') }}
              className={cx(
                'h-[22px] w-[22px] cursor-pointer rounded-full border-2 border-white/15 p-0',
                snapshot.color === 'citrus' && 'border-white shadow-[0_0_0_2px_rgba(255,255,255,0.15)]',
              )}
            />
          </div>

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
        <>
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
        </>
      )}
    </div>
  )
}
