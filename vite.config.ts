import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // relative base: the same build works at a domain root and under /cv4brufers/ on GitHub Pages
  base: './',
  plugins: [react()],
})
