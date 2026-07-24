/** Reads a CSS custom property's resolved value off the document root (e.g. from styles.css). */
export function readCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/**
 * Resolves the font-family stack a Tailwind class (e.g. "font-mono") actually applies,
 * by measuring a throwaway probe element rather than duplicating the stack in TS.
 */
export function readFontStack(tailwindClassName: string): string {
  const probe = document.createElement('span')
  probe.className = tailwindClassName
  probe.style.position = 'absolute'
  probe.style.visibility = 'hidden'
  probe.style.pointerEvents = 'none'
  document.body.appendChild(probe)
  const stack = getComputedStyle(probe).fontFamily
  document.body.removeChild(probe)
  return stack
}
