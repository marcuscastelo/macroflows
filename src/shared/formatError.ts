import { z, ZodError } from 'zod/v4'

function isZodError(error: unknown): error is ZodError {
  return (
    error instanceof ZodError ||
    (typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'ZodError' &&
      'issues' in error)
  )
}

function getZodErrorMessage(error: ZodError): string {
  return `Validation error: \n${z.prettifyError(error)}`
}

export function formatError(error: unknown): string {
  if (isZodError(error)) {
    return getZodErrorMessage(error)
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return `Unknown error: ${JSON.stringify(error, null, 2)}`
}
