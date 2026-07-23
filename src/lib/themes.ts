export type ThemeDef = {
  id: string
  label: string
  /** CSS custom-property values consumed by tailwind.config.js's color tokens. */
  dom: { ink: string; panel: string; line: string; fog: string }
  /** Canvas-drawn equivalents — read directly at render time, no DOM round-trip. */
  canvas: { text: string; grid: string; selectionStroke: string; selectionHandle: string }
}

export const THEMES: ThemeDef[] = [
  {
    id: 'dark',
    label: 'Dark',
    dom: { ink: '#0b0d10', panel: '#14171b', line: '#2a2e35', fog: '#c9cdd3' },
    canvas: {
      text: 'rgba(201,205,211,0.92)',
      grid: 'rgba(255,255,255,0.035)',
      selectionStroke: 'rgba(255,255,255,0.85)',
      selectionHandle: '#ffffff',
    },
  },
  {
    id: 'light',
    label: 'Light',
    dom: { ink: '#f6f3ec', panel: '#efece2', line: '#d8d2c2', fog: '#33312c' },
    canvas: {
      text: 'rgba(51,49,44,0.92)',
      grid: 'rgba(0,0,0,0.045)',
      selectionStroke: 'rgba(20,20,20,0.85)',
      selectionHandle: '#141414',
    },
  },
]

export const DEFAULT_THEME_ID = THEMES[0].id

export function getThemeDef(id: string): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}
