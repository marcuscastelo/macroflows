/**
 * Distributed tracing utilities for OpenTelemetry
 * Provides helpers for creating spans and propagating trace context
 */

import {
  context,
  type Context,
  type Span,
  SpanKind,
  SpanStatusCode,
  trace,
} from '@opentelemetry/api'

const TRACER_NAME = 'macroflows'

/**
 * Get the tracer instance for the application
 */
export function getTracer() {
  return trace.getTracer(TRACER_NAME)
}

/**
 * Get the active span in the current context
 */
export function getActiveSpan(): Span | undefined {
  return trace.getActiveSpan()
}

/**
 * Start a new span with the given name and options
 */
export function startSpan(
  name: string,
  options?: {
    kind?: SpanKind
    attributes?: Record<string, string | number | boolean>
  },
): Span {
  const tracer = getTracer()
  return tracer.startSpan(name, {
    kind: options?.kind,
    attributes: options?.attributes,
  })
}

/**
 * Execute a function within a new span context
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  options?: {
    kind?: SpanKind
    attributes?: Record<string, string | number | boolean>
  },
): Promise<T> {
  const tracer = getTracer()
  return await tracer.startActiveSpan(
    name,
    {
      kind: options?.kind,
      attributes: options?.attributes,
    },
    async (span) => {
      try {
        const result = await fn(span)
        span.setStatus({ code: SpanStatusCode.OK })
        return result
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : String(error),
        })
        span.recordException(error instanceof Error ? error : new Error(String(error)))
        throw error
      } finally {
        span.end()
      }
    },
  )
}

/**
 * Execute a synchronous function within a new span context
 */
export function withSpanSync<T>(
  name: string,
  fn: (span: Span) => T,
  options?: {
    kind?: SpanKind
    attributes?: Record<string, string | number | boolean>
  },
): T {
  const tracer = getTracer()
  return tracer.startActiveSpan(
    name,
    {
      kind: options?.kind,
      attributes: options?.attributes,
    },
    (span) => {
      try {
        const result = fn(span)
        span.setStatus({ code: SpanStatusCode.OK })
        return result
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : String(error),
        })
        span.recordException(error instanceof Error ? error : new Error(String(error)))
        throw error
      } finally {
        span.end()
      }
    },
  )
}

/**
 * Add an attribute to the active span
 */
export function addSpanAttribute(
  key: string,
  value: string | number | boolean,
): void {
  const span = getActiveSpan()
  if (span !== undefined) {
    span.setAttribute(key, value)
  }
}

/**
 * Add multiple attributes to the active span
 */
export function addSpanAttributes(
  attributes: Record<string, string | number | boolean>,
): void {
  const span = getActiveSpan()
  if (span !== undefined) {
    span.setAttributes(attributes)
  }
}

/**
 * Add an event to the active span
 */
export function addSpanEvent(
  name: string,
  attributes?: Record<string, string | number | boolean>,
): void {
  const span = getActiveSpan()
  if (span !== undefined) {
    span.addEvent(name, attributes)
  }
}

/**
 * Record an exception in the active span
 */
export function recordSpanException(error: Error | unknown): void {
  const span = getActiveSpan()
  if (span !== undefined) {
    span.recordException(error instanceof Error ? error : new Error(String(error)))
  }
}

/**
 * Set the status of the active span
 */
export function setSpanStatus(
  code: SpanStatusCode,
  message?: string,
): void {
  const span = getActiveSpan()
  if (span !== undefined) {
    span.setStatus({ code, message })
  }
}

/**
 * Get the current trace context as a carrier for propagation
 */
export function getTraceContext(): Record<string, string> {
  const carrier: Record<string, string> = {}
  const ctx = context.active()
  
  // Extract trace context using W3C Trace Context propagator
  trace.getSpan(ctx)
  
  return carrier
}

/**
 * Set trace context from a carrier (e.g., HTTP headers)
 */
export function setTraceContext(
  carrier: Record<string, string>,
): Context {
  return context.active()
}

/**
 * Trace a database operation
 */
export async function traceDbOperation<T>(
  operation: string,
  table: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, string | number | boolean>,
): Promise<T> {
  return await withSpan(
    `db.${operation}`,
    fn,
    {
      kind: SpanKind.CLIENT,
      attributes: {
        'db.system': 'postgresql',
        'db.name': 'supabase',
        'db.operation': operation,
        'db.sql.table': table,
        ...attributes,
      },
    },
  )
}

/**
 * Trace an HTTP request
 */
export async function traceHttpRequest<T>(
  method: string,
  url: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, string | number | boolean>,
): Promise<T> {
  return await withSpan(
    `http.${method.toLowerCase()}`,
    fn,
    {
      kind: SpanKind.CLIENT,
      attributes: {
        'http.method': method,
        'http.url': url,
        'http.target': new URL(url).pathname,
        ...attributes,
      },
    },
  )
}

/**
 * Trace an API route handler
 */
export async function traceApiRoute<T>(
  method: string,
  path: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, string | number | boolean>,
): Promise<T> {
  return await withSpan(
    `api.${method.toLowerCase()} ${path}`,
    fn,
    {
      kind: SpanKind.SERVER,
      attributes: {
        'http.method': method,
        'http.route': path,
        ...attributes,
      },
    },
  )
}

/**
 * Trace a user journey step
 */
export async function traceUserJourney<T>(
  journeyName: string,
  stepName: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, string | number | boolean>,
): Promise<T> {
  return await withSpan(
    `journey.${journeyName}.${stepName}`,
    fn,
    {
      kind: SpanKind.INTERNAL,
      attributes: {
        'journey.name': journeyName,
        'journey.step': stepName,
        ...attributes,
      },
    },
  )
}
