export default {
  content: {
    relative: true,
    files: ['../index.html', '../src/**/*.{ts,tsx}']
  },
  theme: {
    extend: {
      fontFamily: {
        mono: 'var(--font-mono)',
        sans: 'var(--font-sans)',
        serif: 'var(--font-serif)'
      },
      colors: {
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        panel: 'rgb(var(--color-panel) / <alpha-value>)',
        iconbox: 'rgb(var(--color-icon-box) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        fog: 'rgb(var(--color-fog) / <alpha-value>)',
        accent: '#40A0CD',
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
