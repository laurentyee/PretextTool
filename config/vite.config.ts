import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// This config file lives in config/ alongside postcss.config.js; point Vite's
// postcss resolution at that directory explicitly rather than relying on
// cwd-based auto-discovery, which wouldn't find it here.
const configDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  base: '/PretextTool/',
  plugins: [react()],
  css: {
    postcss: configDir
  },
  server: {
    port: 4173
  }
})
