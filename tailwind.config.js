export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'Arial', 'sans-serif'],
        serif: ['"PP Editorial New"', 'Georgia', 'serif']
      },
      colors: {
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        panel: 'rgb(var(--color-panel) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        fog: 'rgb(var(--color-fog) / <alpha-value>)',
        lime: '#d4ff3d',
        brush: {
          1: 'var(--color-brush-1)',
          2: 'var(--color-brush-2)',
          3: 'var(--color-brush-3)',
          4: 'var(--color-brush-4)'
        },
        scatter: {
          core: 'var(--color-scatter-core)',
          stroke: 'var(--color-scatter-stroke)',
          accent1: 'var(--color-scatter-accent-1)',
          accent2: 'var(--color-scatter-accent-2)',
          accent3: 'var(--color-scatter-accent-3)'
        }
      }
    }
  },
  plugins: []
}
