import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  esbuild: {
    jsx: 'transform',
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    jsxInject: "import h from 'solid-js/h'; const Fragment = h.Fragment;",
  },
  resolve: {
    alias: {
      '~': resolve(process.cwd(), './src'),
    },
  },
})
