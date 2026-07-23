export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        editorial: ['"PP Editorial New"', 'system-ui', 'sans-serif']
      },
      colors: {
        canvas: '#0f172a',
        surface: '#111827',
        accent: '#38bdf8'
      }
    }
  },
  plugins: []
}
