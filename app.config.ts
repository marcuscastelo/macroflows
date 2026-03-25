import { withSentry } from '@sentry/solidstart'
import type { SolidStartInlineConfig } from '@solidjs/start/config'
import { defineConfig } from '@solidjs/start/config'
import tailwindcss from '@tailwindcss/vite'
const baseConfig: SolidStartInlineConfig = {
  ssr: false,
  vite: {
    plugins: [tailwindcss()],
    define: {},
    build: {
      sourcemap: true,
    },
  },
  middleware: './src/middleware.ts',
  server: {
    preset: 'vercel',
    compatibilityDate: 'latest',
  },
}

const sentryWrapped = withSentry(baseConfig, {
  // Sentry `withSentry` options
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  debug: true,
  instrumentation: './src/instrument.server.ts',
})

// Ensure SSR stays disabled even if `withSentry` modifies the config.
export default defineConfig({
  ...sentryWrapped,
  ssr: false,
})
