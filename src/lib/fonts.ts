import { readFontStack } from './readStyle'

export type FontFamily = 'mono' | 'serif' | 'sans'

const TAILWIND_FONT_CLASS: Record<FontFamily, string> = {
  mono: 'font-mono',
  serif: 'font-serif',
  sans: 'font-sans',
}

/** Font-family stacks resolved from tailwind.config.js's fontFamily tokens, not duplicated here. */
export const FONT_STACKS: Record<FontFamily, string> = {
  mono: readFontStack(TAILWIND_FONT_CLASS.mono),
  serif: readFontStack(TAILWIND_FONT_CLASS.serif),
  sans: readFontStack(TAILWIND_FONT_CLASS.sans),
}

export const FONT_FAMILY_OPTIONS: { id: FontFamily; label: string }[] = [
  { id: 'mono', label: 'Mono' },
  { id: 'serif', label: 'Serif' },
  { id: 'sans', label: 'Sans' },
]
