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
        <h2 className="m-0 mb-0.5 font-serif text-[34px] font-semibold text-white">Scrapbook</h2>
        <p className="m-0 mb-[22px] text-[11px] uppercase tracking-[0.1em] text-lime">a live demo of pretext.js</p>
        <ol className="m-0 mb-[26px] list-decimal space-y-2 pl-[18px] text-[13.5px] leading-[1.7] text-fog">
          <li>
            <b className="text-white">Brush</b> — draw on the canvas. The paragraph reflows live around whatever you make.
          </li>
          <li>
            <b className="text-white">Select / Move</b> — click a shape to grab it, drag the corner handle to resize it.
            Text keeps recalculating as it moves.
          </li>
          <li>
            <b className="text-white">Undo</b> steps back one action. <b className="text-white">Clear</b> wipes the canvas.
          </li>
          <li>Colour and brush size live in this panel while the brush tool is active.</li>
        </ol>
        <button
          type="button"
          onClick={onClose}
          className="rounded-[9px] bg-lime px-5 py-[11px] font-mono text-[13px] font-semibold tracking-[0.02em] text-ink hover:brightness-[1.06]"
        >
          Start doodling
        </button>
      </div>
    </div>
  )
}
