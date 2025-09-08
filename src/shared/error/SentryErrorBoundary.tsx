import type { JSX } from 'solid-js'
import { ErrorBoundary } from 'solid-js'

import { sentry } from '~/shared/config/sentry'
import { createErrorHandler } from '~/shared/error/errorHandler'

type SentryErrorBoundaryProps = {
  fallback?: (error: Error) => JSX.Element
  children: JSX.Element
}

const errorHandler = createErrorHandler('application', 'SentryErrorBoundary')

const defaultFallback = (error: Error): JSX.Element => (
  <div class="flex min-h-screen items-center justify-center bg-base-100">
    <div class="card w-96 bg-base-200 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-error">Something went wrong</h2>
        <p class="text-base-content/70">
          An unexpected error occurred. The error has been reported and we'll
          look into it.
        </p>
        <div class="card-actions justify-end">
          <button
            class="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
        {import.meta.env.DEV && (
          <details class="collapse collapse-arrow mt-4">
            <summary class="collapse-title text-sm">
              Error Details (Development)
            </summary>
            <div class="collapse-content">
              <pre class="text-xs text-error">{error.message}</pre>
              <pre class="text-xs text-base-content/50">{error.stack}</pre>
            </div>
          </details>
        )}
      </div>
    </div>
  </div>
)

export function SentryErrorBoundary(props: SentryErrorBoundaryProps) {
  const handleError = (error: Error) => {
    try {
      // Log error through application layer error handler
      errorHandler.apiError(error, {
        component: 'SentryErrorBoundary',
        operation: 'handleGlobalError',
        additionalData: {
          url: window.location.href,
          timestamp: new Date().toISOString(),
        },
      })

      // Capture in Sentry with additional context
      if (sentry.isSentryEnabled()) {
        sentry.captureException(error, {
          errorBoundary: 'SentryErrorBoundary',
          url: window.location.href,
          timestamp: new Date().toISOString(),
        })
      }
    } catch (handlingError) {
      // Fallback if error handling itself fails
      // Only log to console in development mode for fallback errors
      if (import.meta.env.DEV) {
        console.error(
          'Failed to handle error in SentryErrorBoundary:',
          handlingError,
        )
        console.error('Original error:', error)
      }
    }

    return props.fallback ? props.fallback(error) : defaultFallback(error)
  }

  return <ErrorBoundary fallback={handleError}>{props.children}</ErrorBoundary>
}
