import { trace } from '@opentelemetry/api'

import { captureException, isSentryEnabled } from '~/shared/config/sentry'
import { isTracingEnabled } from '~/shared/config/telemetry'
import {
  addSpanEvent,
  addTraceContextToError,
  getTraceContext,
} from '~/shared/utils/tracing'

/**
 * Centralized error handling utilities for the application layer.
 * Components should not directly use console.error, instead they should
 * use these utilities or pass errors to their parent components.
 */

export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info'

export type ErrorContext = {
  component?: string
  operation?: string
  userId?: string
  additionalData?: Record<string, unknown>
}

export type EnhancedErrorContext = {
  operation: string
  entityType?: string
  entityId?: string | number
  userId?: string | number
  severity?: ErrorSeverity
  module?: string
  component?: string
  businessContext?: Record<string, unknown>
  technicalContext?: Record<string, unknown>
  additionalData?: Record<string, unknown>
}

export function getCallerFile(): string | undefined {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const originalPrepareStackTrace = Error.prepareStackTrace

  try {
    Error.prepareStackTrace = (_, stack) => stack
    const err = new Error()

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const stack = err.stack as unknown as NodeJS.CallSite[]

    const caller = stack[2]
    return caller?.getFileName() ?? undefined
  } finally {
    Error.prepareStackTrace = originalPrepareStackTrace
  }
}

function getCallerContext(): string {
  const file = getCallerFile()
  if (file === undefined || file === '') return 'unknown'
  return file.replace(/.*\/src\//, '').replace(/\.[jt]sx?$/, '')
}

/**
 * Enhanced log function that supports both context types
 */
export function logError(error: unknown, context?: ErrorContext): void {
  const timestamp = new Date().toISOString()
  const componentStr =
    typeof context?.component === 'string' && context.component.trim() !== ''
      ? context.component
      : 'Unknown'
  const operationStr =
    typeof context?.operation === 'string' && context.operation.trim() !== ''
      ? `::${context.operation}`
      : ''
  const contextStr = `[${componentStr}${operationStr}]`

  // Add trace context for Sentry correlation
  let errorToLog = error
  if (error instanceof Error) {
    errorToLog = addTraceContextToError(error)
    const traceContext = getTraceContext()
    if (traceContext.traceId !== undefined && traceContext.traceId !== '') {
      console.error(
        `${timestamp} ${contextStr} Error (trace: ${traceContext.traceId}):`,
        errorToLog,
      )
    } else {
      console.error(`${timestamp} ${contextStr} Error:`, errorToLog)
    }

    // Send to Sentry with full context
    if (isSentryEnabled() && errorToLog instanceof Error) {
      captureException(errorToLog, {
        component: componentStr,
        operation: context?.operation ?? 'unknown',
        additionalData: context?.additionalData,
        traceContext,
      })
    }
  } else {
    console.error(`${timestamp} ${contextStr} Error:`, errorToLog)

    // Convert non-Error to Error for Sentry
    if (isSentryEnabled()) {
      const sentryError = new Error(String(errorToLog))
      captureException(sentryError, {
        component: componentStr,
        operation: context?.operation ?? 'unknown',
        additionalData: context?.additionalData,
        originalError: errorToLog,
      })
    }
  }

  if (context?.additionalData !== undefined) {
    console.error('Additional context:', context.additionalData)
  }

  // Record error in OpenTelemetry span if available
  if (isTracingEnabled()) {
    const activeSpan = trace.getActiveSpan()
    if (activeSpan) {
      activeSpan.recordException(
        error instanceof Error ? error : new Error(String(error)),
      )
      activeSpan.setAttributes({
        'error.component': componentStr,
        'error.operation': context?.operation ?? 'unknown',
        'error.type': 'application_error',
      })
      if (context?.userId !== undefined && context.userId !== '') {
        activeSpan.setAttribute('user.id', context.userId)
      }

      // Add event for better visibility in traces
      addSpanEvent('error_occurred', {
        'error.component': componentStr,
        'error.operation': context?.operation ?? 'unknown',
      })
    }
  }
}

/**
 * Enhanced log function for comprehensive error contexts
 */
export function logEnhancedError(
  error: unknown,
  context: EnhancedErrorContext,
): void {
  const timestamp = new Date().toISOString()
  const severity = context.severity ?? 'error'
  const module = context.module ?? 'unknown'
  const component = context.component ?? getCallerContext()
  const operation = context.operation

  const contextStr = `[${severity.toUpperCase()}][${module}][${component}::${operation}]`

  console.error(`${timestamp} ${contextStr} Error:`, error)

  // Send to Sentry with enhanced context
  if (isSentryEnabled()) {
    const errorToSend =
      error instanceof Error ? error : new Error(String(error))
    captureException(errorToSend, {
      severity,
      module,
      component,
      operation,
      entityType: context.entityType,
      entityId: context.entityId,
      userId: context.userId,
      businessContext: context.businessContext,
      technicalContext: context.technicalContext,
    })
  }

  if (context.entityType !== undefined && context.entityId !== undefined) {
    console.error(`Entity: ${context.entityType}#${context.entityId}`)
  }

  if (context.userId !== undefined) {
    console.error(`User: ${context.userId}`)
  }

  if (context.businessContext) {
    console.error('Business context:', context.businessContext)
  }

  if (context.technicalContext) {
    console.error('Technical context:', context.technicalContext)
  }

  // Record error in OpenTelemetry span if available
  if (isTracingEnabled()) {
    const activeSpan = trace.getActiveSpan()
    if (activeSpan) {
      activeSpan.recordException(
        error instanceof Error ? error : new Error(String(error)),
      )
      activeSpan.setAttributes({
        'error.severity': severity,
        'error.module': module,
        'error.component': component,
        'error.operation': operation,
        'error.type': 'enhanced_error',
      })
      if (context.entityType !== undefined && context.entityId !== undefined) {
        activeSpan.setAttributes({
          'entity.type': context.entityType,
          'entity.id': String(context.entityId),
        })
      }
      if (context.userId !== undefined) {
        activeSpan.setAttribute('user.id', String(context.userId))
      }
    }
  }
}

export const ORIGINAL_ERROR_SYMBOL = Symbol('originalError')
export function wrapErrorWithStack(error: unknown): Error {
  let message = 'Unknown error'
  if (typeof error === 'object' && error !== null) {
    const keys = Object.keys(error)
    if ('message' in error && typeof error.message === 'string') {
      if (keys.length > 1) {
        message = `${error.message}: ${JSON.stringify(error)}`
      } else {
        message = error.message
      }
    } else {
      message = JSON.stringify(error)
    }
  }
  const wrapped: Error = new Error(message)
  if (error instanceof Error) {
    wrapped.stack = error.stack
  }
  Object.defineProperty(wrapped, ORIGINAL_ERROR_SYMBOL, {
    value: error,
    enumerable: false,
    configurable: true,
    writable: true,
  })
  return wrapped
}

/**
 * Creates a contextual error handler for any module and entity type.
 * Automatically infers execution context to reduce boilerplate across the entire codebase.
 *
 * This factory function should be used in ALL modules and layers to replace direct calls
 * to handleInfrastructureError, handleApplicationError, handleValidationError, etc.
 *
 * @param module - The architectural layer: 'application' | 'infrastructure' | 'validation' | 'user' | 'system' | 'domain'
 * @param entityType - The business entity being operated on (e.g., 'Food', 'Recipe', 'DayDiet', 'User')
 *
 */
export function createErrorHandler<
  TModule extends
    | 'application'
    | 'infrastructure'
    | 'validation'
    | 'user'
    | 'system'
    | 'domain',
>(module: TModule, entityType: string) {
  return {
    /**
     * Handle errors with automatic context inference.
     */
    error: (error: unknown, context?: Partial<EnhancedErrorContext>): void => {
      const inferredComponent = getCallerContext()
      const enhancedContext: EnhancedErrorContext = {
        module,
        entityType,
        component: inferredComponent,
        operation: context?.operation ?? 'unknown',
        severity: context?.severity ?? 'error',
        ...context,
      }

      let errorToLog = error
      if (!(error instanceof Error)) {
        errorToLog = wrapErrorWithStack(error)
      }

      logEnhancedError(errorToLog, enhancedContext)
    },

    /**
     * Handle API-specific errors with automatic context inference.
     */
    apiError: (
      error: unknown,
      context?: Partial<EnhancedErrorContext>,
    ): void => {
      const inferredComponent = getCallerContext()
      const enhancedContext: EnhancedErrorContext = {
        module,
        entityType,
        component: inferredComponent,
        operation: context?.operation ?? 'API request',
        severity: context?.severity ?? 'error',
        ...context,
      }

      let errorToLog = error
      if (!(error instanceof Error)) {
        errorToLog = wrapErrorWithStack(error)
      }

      logEnhancedError(errorToLog, enhancedContext)
    },

    /**
     * Handle validation errors with automatic context inference.
     */
    validationError: (
      error: unknown,
      context?: Partial<EnhancedErrorContext>,
    ): void => {
      const inferredComponent = getCallerContext()
      const enhancedContext: EnhancedErrorContext = {
        module,
        entityType,
        component: inferredComponent,
        operation: context?.operation ?? 'validation',
        severity: context?.severity ?? 'warning',
        ...context,
      }

      let errorToLog = error
      if (!(error instanceof Error)) {
        errorToLog = wrapErrorWithStack(error)
      }

      logEnhancedError(errorToLog, enhancedContext)
    },

    /**
     * Handle critical system errors with automatic context inference.
     */
    criticalError: (
      error: unknown,
      context?: Partial<EnhancedErrorContext>,
    ): void => {
      const inferredComponent = getCallerContext()
      const enhancedContext: EnhancedErrorContext = {
        module,
        entityType,
        component: inferredComponent,
        operation: context?.operation ?? 'system operation',
        severity: 'critical',
        ...context,
      }

      let errorToLog = error
      if (!(error instanceof Error)) {
        errorToLog = wrapErrorWithStack(error)
      }

      logEnhancedError(errorToLog, enhancedContext)
    },
  }
}

export function isBackendOutageError(error: unknown): boolean {
  if (typeof error === 'string') {
    return (
      error.includes('Failed to fetch') ||
      error.includes('NetworkError') ||
      error.includes('CORS') ||
      error.includes('net::ERR') ||
      error.includes('Network request failed')
    )
  }
  if (typeof error === 'object' && error !== null) {
    const msg =
      'message' in error && typeof error.message === 'string'
        ? error.message
        : ''
    const details =
      'details' in error && typeof error.details === 'string'
        ? error.details
        : ''
    return (
      msg.includes('Failed to fetch') ||
      msg.includes('NetworkError') ||
      msg.includes('CORS') ||
      msg.includes('net::ERR') ||
      msg.includes('Network request failed') ||
      details.includes('Failed to fetch') ||
      details.includes('NetworkError') ||
      details.includes('CORS') ||
      details.includes('net::ERR') ||
      details.includes('Network request failed')
    )
  }
  return false
}
