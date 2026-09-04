import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // The domain layer (change algorithm, reducer) is plain TypeScript and
    // needs no DOM, so the default node environment is sufficient.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
