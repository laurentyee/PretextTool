/** Reads a CSS custom property's resolved value off the document root (e.g. from styles.css). */
export function readCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}
