/**
 * Base class for errors that support toast deduplication.
 *
 * Extends Error with a stable errorId for deduplication purposes.
 * When used with showError, errors with the same errorId won't be shown
 * multiple times if a toast with that error is already visible or queued.
 */
export class DeduplicableError extends Error {
  /**
   * Stable identifier for toast deduplication.
   * Errors with the same errorId and type won't generate duplicate toasts.
   */
  readonly errorId: string

  constructor(message: string, errorId: string) {
    super(message)
    this.name = 'DeduplicableError'
    this.errorId = errorId
  }
}

/**
 * Error thrown when weight data is not found for a specific day.
 */
export class WeightNotFoundForDayError extends DeduplicableError {
  static readonly ERROR_ID = 'weight-not-found-for-day'

  readonly day: Date

  constructor(day: Date) {
    super(
      `Peso não encontrado para o dia ${day.toISOString()}`,
      WeightNotFoundForDayError.ERROR_ID,
    )
    this.name = 'WeightNotFoundForDayError'
    this.day = day
  }
}

/**
 * Error thrown when macro target is not found for a specific day.
 */
export class MacroTargetNotFoundForDayError extends DeduplicableError {
  static readonly ERROR_ID = 'macro-target-not-found-for-day'

  readonly day: Date

  constructor(day: Date) {
    super(
      `Meta de macros não encontrada para o dia ${day.toISOString()}`,
      MacroTargetNotFoundForDayError.ERROR_ID,
    )
    this.name = 'MacroTargetNotFoundForDayError'
    this.day = day
  }
}

/**
 * Type guard to check if an error is a DeduplicableError.
 */
export function isDeduplicableError(
  error: unknown,
): error is DeduplicableError {
  if (error instanceof DeduplicableError) {
    return true
  }
  if (error instanceof Error && 'errorId' in error) {
    const errorWithId = error
    return typeof errorWithId.errorId === 'string'
  }
  return false
}
