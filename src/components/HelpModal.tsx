import { cx } from '../lib/utils/cx'

type HelpModalProps = {
  open: boolean
  onClose: () => void
}

export default function HelpModal({ open, onClose }: HelpModalProps) {
  return (
    <div
      className={cx(
        'fixed inset-0 z-50 flex items-center justify-center bg-[rgba(5,6,8,0.72)] p-5 backdrop-blur-md transition-opacity duration-200',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <div className="w-full max-w-[440px] rounded-[18px] border border-line bg-panel p-9 text-fog">
        <h2 className="m-0 mb-0.5 font-serif text-[36px] text-color-ink">embellish the text</h2>
        <p className="m-0 mb-[22px] text-[11px] uppercase tracking-[0.1em] text-color-ink">a live demo of pretext.js</p>
        <ol className="m-0 mb-[26px] list-decimal space-y-2 pl-[18px] text-[13.5px] leading-[1.7] text-fog">
          <li>
            <b className="text-color-ink">Brush</b> — draw on the canvas. The paragraph reflows live around whatever you make.
          </li>
          <li>
            <b className="text-color-ink">Select / Move</b> — click a shape to grab it, drag the corner handle to resize it.
            Text keeps recalculating as it moves.
          </li>
          <li>Change brush colours, size and stickers upon selecting brush or sticker tools!</li>
          <li>
            <b className="text-color-ink">Undo</b> and <b className="text-color-ink">Redo</b> help you edit safely, while clicking the <b className="text-color-ink">Trash icon </b> wipes the canvas.
          </li>
          <li>
            Change <b className="text-color-ink">theme</b> and <b className="text-color-ink">font</b> too!
          </li>
        </ol>
        <button
          type="button"
          onClick={onClose}
          className="rounded-[9px] bg-accent px-5 py-[11px] font-mono text-[13px] font-semibold uppercase tracking-[0.02em] text-ink hover:brightness-[1.06]"
        >
          Start doodling
        </button>
      </div>
    </div>
  )
}
