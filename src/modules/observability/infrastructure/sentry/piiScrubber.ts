import type { Event, EventHint } from '@sentry/solidstart'

/**
 * PII scrubbing configuration and utilities for Sentry events.
 * Implements detection and redaction of common Brazilian PII patterns.
 */

/**
 * Common Brazilian PII patterns to detect and scrub.
 * These patterns cover email, phone numbers, CPF, CNPJ, and credit cards.
 */
const PII_PATTERNS = {
  // Email: standard email format
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,

  // Brazilian phone numbers (various formats):
  // (11) 98765-4321, (11) 9 8765-4321, 11987654321, +55 11 98765-4321
  phone: /(?:\+55\s?)?(?:\(?\d{2}\)?[\s-]?)?(?:9\s?)?\d{4,5}[-\s]?\d{4}\b/g,

  // CPF: Brazilian individual taxpayer ID (11 digits)
  // Formats: 123.456.789-10, 12345678910
  cpf: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g,

  // CNPJ: Brazilian company taxpayer ID (14 digits)
  // Formats: 12.345.678/0001-10, 12345678000110
  cnpj: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g,

  // Credit card numbers (13-19 digits, with optional spaces/dashes)
  // Matches formats like: 1234567890123456, 1234-5678-9012-3456, 1234 5678 9012 3456
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4,7}\b/g,
} as const

/**
 * Sensitive keys that commonly contain PII data.
 * These keys will have their values scrubbed from events.
 */
const SENSITIVE_KEYS = [
  'password',
  'passwd',
  'pwd',
  'secret',
  'token',
  'api_key',
  'apikey',
  'access_token',
  'accesstoken',
  'auth',
  'authorization',
  'cookie',
  'csrf',
  'credit_card',
  'creditcard',
  'ssn',
  'social_security',
  'cpf',
  'cnpj',
  'phone',
  'telephone',
  'email',
  'e-mail',
  'private_key',
  'privatekey',
  'session',
  'sessionid',
] as const

/**
 * Replacement text for scrubbed PII data.
 */
const PII_REDACTED = '[REDACTED]'

/**
 * Checks if a key name indicates it may contain sensitive data.
 */
function isSensitiveKey(key: string): boolean {
  const lowerKey = key.toLowerCase()
  return SENSITIVE_KEYS.some((sensitiveKey) => lowerKey.includes(sensitiveKey))
}

/**
 * Scrubs PII patterns from a string value.
 * Replaces emails, phone numbers, CPF, CNPJ, and credit card numbers.
 */
function scrubPiiFromString(value: string): string {
  let scrubbed = value

  // Apply all PII pattern replacements
  scrubbed = scrubbed.replace(PII_PATTERNS.email, PII_REDACTED)
  scrubbed = scrubbed.replace(PII_PATTERNS.phone, PII_REDACTED)
  scrubbed = scrubbed.replace(PII_PATTERNS.cpf, PII_REDACTED)
  scrubbed = scrubbed.replace(PII_PATTERNS.cnpj, PII_REDACTED)
  scrubbed = scrubbed.replace(PII_PATTERNS.creditCard, PII_REDACTED)

  return scrubbed
}

/**
 * Recursively scrubs PII from an object or array.
 * Handles nested structures and sensitive keys.
 */
function scrubPiiFromValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value
  }

  if (typeof value === 'string') {
    return scrubPiiFromString(value)
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => scrubPiiFromValue(item))
  }

  if (typeof value === 'object') {
    const scrubbed: Record<string, unknown> = {}

    for (const [key, val] of Object.entries(value)) {
      // If key is sensitive, redact the entire value
      if (isSensitiveKey(key)) {
        scrubbed[key] = PII_REDACTED
      } else {
        // Otherwise, recursively scrub the value
        scrubbed[key] = scrubPiiFromValue(val)
      }
    }

    return scrubbed
  }

  return value
}

/**
 * Scrubs PII from Sentry event exception messages and stack traces.
 */
function scrubExceptions(event: Event): Event {
  if (event.exception?.values) {
    event.exception.values = event.exception.values.map((exception) => ({
      ...exception,
      value: exception.value
        ? scrubPiiFromString(exception.value)
        : exception.value,
      stacktrace: exception.stacktrace
        ? {
            ...exception.stacktrace,
            frames: exception.stacktrace.frames?.map((frame) => ({
              ...frame,
              vars: frame.vars
                ? (scrubPiiFromValue(frame.vars) as Record<string, unknown>)
                : frame.vars,
            })),
          }
        : exception.stacktrace,
    }))
  }

  return event
}

/**
 * Scrubs PII from Sentry event message.
 */
function scrubMessage(event: Event): Event {
  if (event.message) {
    event.message = scrubPiiFromString(event.message)
  }

  return event
}

/**
 * Scrubs PII from Sentry event breadcrumbs.
 */
function scrubBreadcrumbs(event: Event): Event {
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => ({
      ...breadcrumb,
      message: breadcrumb.message
        ? scrubPiiFromString(breadcrumb.message)
        : breadcrumb.message,
      data: breadcrumb.data
        ? (scrubPiiFromValue(breadcrumb.data) as Record<string, unknown>)
        : breadcrumb.data,
    }))
  }

  return event
}

/**
 * Scrubs PII from Sentry event request data.
 */
function scrubRequest(event: Event): Event {
  if (event.request) {
    const scrubbedRequest = { ...event.request }

    // Scrub URL parameters
    if (scrubbedRequest.url) {
      scrubbedRequest.url = scrubPiiFromString(scrubbedRequest.url)
    }

    if (scrubbedRequest.query_string) {
      scrubbedRequest.query_string = scrubPiiFromString(
        scrubbedRequest.query_string,
      )
    }

    // Scrub headers
    if (scrubbedRequest.headers) {
      scrubbedRequest.headers = scrubPiiFromValue(
        scrubbedRequest.headers,
      ) as Record<string, string>
    }

    // Scrub cookies
    if (scrubbedRequest.cookies) {
      scrubbedRequest.cookies = scrubPiiFromValue(
        scrubbedRequest.cookies,
      ) as Record<string, string>
    }

    // Scrub request data/body
    if (scrubbedRequest.data) {
      scrubbedRequest.data = scrubPiiFromValue(scrubbedRequest.data)
    }

    event.request = scrubbedRequest
  }

  return event
}

/**
 * Scrubs PII from Sentry event context data.
 */
function scrubContexts(event: Event): Event {
  if (event.contexts) {
    event.contexts = scrubPiiFromValue(event.contexts) as typeof event.contexts
  }

  return event
}

/**
 * Scrubs PII from Sentry event extra data.
 */
function scrubExtra(event: Event): Event {
  if (event.extra) {
    event.extra = scrubPiiFromValue(event.extra) as Record<string, unknown>
  }

  return event
}

/**
 * Scrubs PII from Sentry event user data.
 * Preserves user ID for tracking while scrubbing email and other PII.
 */
function scrubUser(event: Event): Event {
  if (event.user) {
    const scrubbedUser = { ...event.user }

    // Scrub email
    if (scrubbedUser.email) {
      scrubbedUser.email = PII_REDACTED
    }

    // Scrub username if it looks like an email or contains PII
    if (scrubbedUser.username) {
      scrubbedUser.username = scrubPiiFromString(scrubbedUser.username)
    }

    // Scrub IP address
    if (scrubbedUser.ip_address) {
      scrubbedUser.ip_address = PII_REDACTED
    }

    event.user = scrubbedUser
  }

  return event
}

/**
 * Main PII scrubbing function for Sentry events.
 * This function should be used as Sentry's `beforeSend` hook.
 *
 * @param event - The Sentry event to scrub
 * @param hint - Additional context about the event
 * @returns The scrubbed event or null to drop the event
 */
export function scrubPiiFromEvent(
  event: Event,
  hint: EventHint,
): Event | null {
  try {
    // Apply all scrubbing operations
    let scrubbedEvent = scrubExceptions(event)
    scrubbedEvent = scrubMessage(scrubbedEvent)
    scrubbedEvent = scrubBreadcrumbs(scrubbedEvent)
    scrubbedEvent = scrubRequest(scrubbedEvent)
    scrubbedEvent = scrubContexts(scrubbedEvent)
    scrubbedEvent = scrubExtra(scrubbedEvent)
    scrubbedEvent = scrubUser(scrubbedEvent)

    return scrubbedEvent
  } catch (error) {
    // If scrubbing fails, log the error but still send the event
    // to avoid losing error tracking data
    console.error('Failed to scrub PII from Sentry event:', error)
    return event
  }
}
