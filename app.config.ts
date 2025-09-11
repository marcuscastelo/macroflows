import { defineConfig } from '@solidjs/start/config'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  ssr: false,
  vite: {
    plugins: [tailwindcss()],
    define: {},
    build: {
      sourcemap: true,
    },
  },
  server: {
    preset: 'vercel',
    compatibilityDate: 'latest',
  },
})
