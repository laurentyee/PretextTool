type FooterProps = {
  onHelp: () => void
}

export default function Footer({ onHelp }: FooterProps) {
  return (
    <footer className="flex h-16 w-full flex-none items-center justify-between gap-3 border-t border-fog/30 bg-ink px-5">
      <div className="truncate font-serif text-[28px] text-fog/85">embellish the text</div>
      <div className="flex flex-none items-center gap-3">
        <a
          href="https://github.com/laurentyee/PretextTool"
          target="_blank"
          rel="noreferrer"
          className="hidden whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.08em] text-fog/60 hover:text-fog sm:inline"
        >
          Made by Laurent Yee / GitHub
        </a>
        <button
          type="button"
          title="Help"
          aria-label="Help"
          onClick={onHelp}
          className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-line font-mono text-[14px] text-fog transition-colors hover:bg-white/[0.06]"
        >
          ?
        </button>
      </div>
    </footer>
  )
}
