import { trace } from '@opentelemetry/api'

import { formatError } from '~/shared/formatError'
import { logging } from '~/shared/utils/logging'

export interface ErrorContext {
  component: string
  operation: string
  additionalData?: Record<string, unknown>
}

/**
 * Centralized error handler for application-layer errors.
 * Logs errors with OpenTelemetry tracing and provides context for debugging.
 *
 * @param error - The error that occurred
 * @param context - Context information including component, operation, and additional data
 *
 * @example
 * ```typescript
 * try {
 *   await someOperation()
 * } catch (error) {
 *   handleApiError(error, {
 *     component: 'UserService',
 *     operation: 'fetchUsers',
 *     additionalData: { userId: '123' }
 *   })
 *   throw error
 * }
 * ```
 */
export function handleApiError(error: unknown, context: ErrorContext): void {
  const tracer = trace.getTracer('macroflows')
  const span = tracer.startSpan(`error.${context.component}.${context.operation}`, {
    attributes: {
      'error.type': error instanceof Error ? error.constructor.name : typeof error,
      'error.message': formatError(error),
      'code.component': context.component,
      'code.operation': context.operation,
      'error.stack': error instanceof Error ? error.stack : undefined,
      ...context.additionalData,
    },
  })

  try {
    const errorMessage = formatError(error)
    logging.error(
      `${context.component}.${context.operation} error: ${errorMessage}`,
      error,
      context.additionalData,
    )

    span.addEvent('error.handled', {
      'error.message': errorMessage,
      'error.handled': true,
    })
  } finally {
    span.end()
  }
}
