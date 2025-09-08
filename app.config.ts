import { defineConfig } from '@solidjs/start/config'
import tailwindcss from '@tailwindcss/vite'

// Skip Sentry Vite plugin for now - can be added later when package is installed
// const useSentryPlugin = false

export default defineConfig({
  ssr: false,
  vite: {
    plugins: [
      tailwindcss(),
      // Sentry plugin can be added later when @sentry/vite-plugin is installed
      // For now, we enable source maps for future Sentry integration
    ],
    define: {},
    build: {
      sourcemap: true, // Enable source maps for Sentry
    },
  },
  server: {
    preset: 'vercel',
    compatibilityDate: 'latest',
  },
})
