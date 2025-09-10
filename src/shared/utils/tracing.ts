import type { Span } from '@opentelemetry/api'
import { SpanKind, SpanStatusCode, trace } from '@opentelemetry/api'

import { getTracer, isTracingEnabled } from '~/shared/config/telemetry'

type SpanOptions = {
  kind?: SpanKind
  attributes?: Record<string, string | number | boolean>
}

/**
 * Creates a span for the given operation name and executes the function within that span.
 * Automatically handles span status and error recording.
 */
export const withSpan = <T>(
  operationName: string,
  fn: (span: Span) => T | Promise<T>,
  options: SpanOptions = {},
): T | Promise<T> => {
  if (!isTracingEnabled()) {
    // If tracing is not enabled, execute the function directly without span
    const noOpSpan: Span = {
      setAttributes: () => noOpSpan,
      setAttribute: () => noOpSpan,
      addEvent: () => noOpSpan,
      addLink: () => noOpSpan,
      addLinks: () => noOpSpan,
      updateName: () => noOpSpan,
      recordException: () => {},
      setStatus: () => noOpSpan,
      end: () => {},
      spanContext: () => ({ traceId: '', spanId: '', traceFlags: 0 }),
      isRecording: () => false,
    }
    return fn(noOpSpan)
  }

  const tracer = getTracer()

  return tracer.startActiveSpan(
    operationName,
    {
      kind: options.kind ?? SpanKind.INTERNAL,
      attributes: options.attributes,
    },
    (span) => {
      try {
        const result = fn(span)

        // Handle both sync and async operations
        if (result instanceof Promise) {
          return result
            .then((value) => {
              span.setStatus({ code: SpanStatusCode.OK })
              span.end()
              return value
            })
            .catch((error) => {
              span.recordException(
                error instanceof Error ? error : new Error(String(error)),
              )
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: error instanceof Error ? error.message : String(error),
              })
              span.end()
              throw error
            })
        } else {
          span.setStatus({ code: SpanStatusCode.OK })
          span.end()
          return result
        }
      } catch (error) {
        span.recordException(
          error instanceof Error ? error : new Error(String(error)),
        )
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : String(error),
        })
        span.end()
        throw error
      }
    },
  )
}

/**
 * Creates a span for database operations with standard attributes
 */
export const withDatabaseSpan = <T>(
  operation: string,
  table: string,
  fn: (span: Span) => T | Promise<T>,
  additionalAttributes: Record<string, string | number | boolean> = {},
): T | Promise<T> => {
  return withSpan(`db.${operation}`, fn, {
    kind: SpanKind.CLIENT,
    attributes: {
      'db.system': 'postgresql',
      'db.operation': operation,
      'db.table': table,
      'db.provider': 'supabase',
      ...additionalAttributes,
    },
  })
}

/**
 * Creates a span for HTTP client operations
 */
export const withHttpClientSpan = <T>(
  method: string,
  url: string,
  fn: (span: Span) => T | Promise<T>,
  additionalAttributes: Record<string, string | number | boolean> = {},
): T | Promise<T> => {
  return withSpan(`http.client.${method.toLowerCase()}`, fn, {
    kind: SpanKind.CLIENT,
    attributes: {
      'http.method': method,
      'http.url': url,
      ...additionalAttributes,
    },
  })
}

/**
 * Creates a span for user interface operations
 */
export const withUISpan = <T>(
  component: string,
  action: string,
  fn: (span: Span) => T | Promise<T>,
  additionalAttributes: Record<string, string | number | boolean> = {},
): T | Promise<T> => {
  return withSpan(`ui.${component}.${action}`, fn, {
    attributes: {
      'ui.component': component,
      'ui.action': action,
      ...additionalAttributes,
    },
  })
}

/**
 * Adds custom attributes to the currently active span
 */
export const addSpanAttributes = (
  attributes: Record<string, string | number | boolean>,
): void => {
  if (!isTracingEnabled()) return

  const activeSpan = trace.getActiveSpan()
  if (activeSpan) {
    Object.entries(attributes).forEach(([key, value]) => {
      activeSpan.setAttribute(key, value)
    })
  }
}

/**
 * Records an event in the currently active span
 */
export const addSpanEvent = (
  name: string,
  attributes?: Record<string, string | number | boolean>,
): void => {
  if (!isTracingEnabled()) return

  const activeSpan = trace.getActiveSpan()
  if (activeSpan) {
    activeSpan.addEvent(name, attributes)
  }
}

/**
 * Gets the current trace and span IDs for correlation with external systems (e.g., Sentry)
 */
export const getTraceContext = (): {
  traceId?: string
  spanId?: string
} => {
  if (!isTracingEnabled()) return {}

  const activeSpan = trace.getActiveSpan()
  if (!activeSpan) return {}

  const spanContext = activeSpan.spanContext()
  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
  }
}

/**
 * Adds trace context to error objects for Sentry correlation
 */
export const addTraceContextToError = (error: Error): Error => {
  const traceContext = getTraceContext()

  if (
    traceContext.traceId !== undefined &&
    traceContext.traceId !== '' &&
    traceContext.spanId !== undefined &&
    traceContext.spanId !== ''
  ) {
    // Add trace context as error properties for Sentry
    Object.assign(error, {
      traceId: traceContext.traceId,
      spanId: traceContext.spanId,
    })
  }

  return error
}

/**
 * Creates a span for user flow performance tracking
 */
export const withUserFlowSpan = <T>(
  flowName: string,
  step: string,
  fn: (span: Span) => T | Promise<T>,
  userId?: string,
): T | Promise<T> => {
  return withSpan(`user_flow.${flowName}.${step}`, fn, {
    attributes: {
      'user_flow.name': flowName,
      'user_flow.step': step,
      'user_flow.step_type': 'performance',
      ...(userId !== undefined && userId !== '' ? { 'user.id': userId } : {}),
    },
  })
}

/**
 * Creates a span for page navigation performance tracking
 */
export const withNavigationSpan = <T>(
  fromPage: string,
  toPage: string,
  fn: (span: Span) => T | Promise<T>,
): T | Promise<T> => {
  return withSpan(`navigation.${fromPage}_to_${toPage}`, fn, {
    attributes: {
      'navigation.from_page': fromPage,
      'navigation.to_page': toPage,
      'navigation.type': 'performance',
    },
  })
}

/**
 * Measures and reports the duration of a user flow step
 */
export const measureUserFlowDuration = async <T>(
  flowName: string,
  step: string,
  operation: () => T | Promise<T>,
  options?: {
    userId?: string
    additionalContext?: Record<string, string | number | boolean>
  },
): Promise<T> => {
  const startTime = Date.now()

  return withUserFlowSpan(
    flowName,
    step,
    async (span) => {
      try {
        // Add additional context if provided
        if (options?.additionalContext) {
          span.setAttributes(options.additionalContext)
        }

        const result = await operation()

        const duration = Date.now() - startTime
        span.setAttributes({
          'performance.duration_ms': duration,
          'performance.status': 'success',
        })

        span.addEvent('flow_step_completed', {
          duration_ms: duration,
          status: 'success',
        })

        return result
      } catch (error) {
        const duration = Date.now() - startTime
        span.setAttributes({
          'performance.duration_ms': duration,
          'performance.status': 'error',
        })

        span.addEvent('flow_step_failed', {
          duration_ms: duration,
          status: 'error',
          error_message: error instanceof Error ? error.message : String(error),
        })

        throw error
      }
    },
    options?.userId,
  )
}
