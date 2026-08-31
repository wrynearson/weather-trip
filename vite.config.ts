/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const pkg = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, 'package.json'), 'utf-8'),
) as { version: string }

// https://vite.dev/config/
export default defineConfig({
  base: '/weather-trip/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['./vitest.setup.ts'],
    // Pin the test process to UTC so date-boundary logic (daysUntil, etc.)
    // is deterministic regardless of the machine/CI runner's local timezone.
    env: { TZ: 'UTC' },
  },
})
