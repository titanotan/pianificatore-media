import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Percorsi relativi: il sito funziona su GitHub Pages
  // qualunque sia il nome del repository (https://utente.github.io/<repo>/).
  base: './',
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
