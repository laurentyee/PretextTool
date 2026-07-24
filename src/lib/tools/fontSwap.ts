import { readCssVar } from '../utils/readStyle'

export type FontFamily = 'mono' | 'serif' | 'sans'

const FONT_STACKS: Record<FontFamily, string> = {
  mono: readCssVar('--font-mono'),
  serif: readCssVar('--font-serif'),
  sans: readCssVar('--font-sans'),
}

export const FONT_FAMILY_OPTIONS: { id: FontFamily; label: string }[] = [
  { id: 'mono', label: 'Mono' },
  { id: 'serif', label: 'Serif' },
  { id: 'sans', label: 'Sans' },
]

export function fontStack(family: FontFamily): string {
  return FONT_STACKS[family]
}
