export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        editorial: ['"PP Editorial New"', 'system-ui', 'sans-serif']
      },
      colors: {
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        panel: 'rgb(var(--color-panel) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        fog: 'rgb(var(--color-fog) / <alpha-value>)',
        lime: '#d4ff3d'
      }
    }
  },
  plugins: []
}
