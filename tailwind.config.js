export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        editorial: ['"PP Editorial New"', 'system-ui', 'sans-serif']
      },
      colors: {
        ink: '#0b0d10',
        panel: '#14171b',
        line: '#2a2e35',
        fog: '#c9cdd3',
        lime: '#d4ff3d'
      }
    }
  },
  plugins: []
}
