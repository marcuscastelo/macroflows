import { withSentry } from '@sentry/solidstart'
import { defineConfig } from '@solidjs/start/config'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig(
  withSentry(
    {
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
    },
    {
      // Sentry `withSentry` options
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      debug: true,
      instrumentation: './src/instrument.server.ts',
    },
  ),
)
