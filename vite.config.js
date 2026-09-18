import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Alias @/ -> src/ (Fase 22). Disponible para código nuevo; el código
    // existente sigue con imports relativos, no se migró (fuera de alcance).
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
