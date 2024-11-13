/// <reference types="vitest" />
/// <reference types="vite/client" />

import { resolve } from 'node:path'
import devtools from 'solid-devtools/vite'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'

export default defineConfig({
  plugins: [
    UnoCSS(),
    devtools(),
    solidPlugin(),
  ],
  server: {
    port: 3001,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['node_modules/@testing-library/jest-dom/vitest'],
    // coverage: {
    //   provider: 'v8',
    // },
  },
  build: {
    target: 'esnext',
  },
  resolve: {
    conditions: ['development', 'browser'],
    alias: {
      '@orm': resolve(__dirname, '../unstorage-orm'),
    },
  },
})
