export type ThemeId = 'dark' | 'light'

export const THEMES: { id: ThemeId; label: string }[] = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
]

export const DEFAULT_THEME_ID: ThemeId = THEMES[0].id
