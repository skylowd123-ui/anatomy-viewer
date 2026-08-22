import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative assets work both at a custom domain and under /repository-name/ on GitHub Pages.
  base: './',
  plugins: [react()],
  server: { host: true, allowedHosts: true },
  build: { target: 'es2020', sourcemap: true }
})
