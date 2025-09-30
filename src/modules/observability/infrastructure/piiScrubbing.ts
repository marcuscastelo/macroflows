export type ScrubOptions = {
  scrubEmails?: boolean
  scrubPhones?: boolean
  scrubCreditCards?: boolean
  scrubPasswords?: boolean
  replacement?: string
}

const DEFAULT_OPTIONS: Required<ScrubOptions> = {
  scrubEmails: true,
  scrubPhones: true,
  scrubCreditCards: true,
  scrubPasswords: true,
  replacement: '[REDACTED]',
}

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
const PHONE_REGEX =
  /\b(\+?\d{1,3}[-.\s]?)?\(?\d{2,3}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}\b/g
const CREDIT_CARD_REGEX = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g
const PASSWORD_KEYS = [
  'password',
  'passwd',
  'pwd',
  'secret',
  'token',
  'apikey',
  'api_key',
  'authorization',
]

export function scrubPII(data: unknown, options: ScrubOptions = {}): unknown {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  if (typeof data === 'string') {
    return scrubString(data, opts)
  }

  if (Array.isArray(data)) {
    return data.map((item) => scrubPII(item, opts))
  }

  if (typeof data === 'object' && data !== null) {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      if (opts.scrubPasswords && isPasswordKey(key)) {
        result[key] = opts.replacement
      } else {
        result[key] = scrubPII(value, opts)
      }
    }
    return result
  }

  return data
}

function scrubString(str: string, opts: Required<ScrubOptions>): string {
  let result = str

  if (opts.scrubEmails) {
    result = result.replace(EMAIL_REGEX, opts.replacement)
  }

  if (opts.scrubPhones) {
    result = result.replace(PHONE_REGEX, opts.replacement)
  }

  if (opts.scrubCreditCards) {
    result = result.replace(CREDIT_CARD_REGEX, opts.replacement)
  }

  return result
}

function isPasswordKey(key: string): boolean {
  const lowerKey = key.toLowerCase()
  return PASSWORD_KEYS.some((passwordKey) => lowerKey.includes(passwordKey))
}

type SentryEvent = {
  request?: {
    data?: unknown
    headers?: unknown
  }
  extra?: unknown
  contexts?: unknown
  breadcrumbs?: Array<{
    data?: unknown
    message?: unknown
    [key: string]: unknown
  }>
  [key: string]: unknown
}

export function scrubSentryEvent(event: SentryEvent): SentryEvent {
  if (event.request !== undefined) {
    if (event.request.data !== undefined) {
      event.request.data = scrubPII(event.request.data)
    }
    if (event.request.headers !== undefined) {
      event.request.headers = scrubPII(event.request.headers)
    }
  }

  if (event.extra !== undefined) {
    event.extra = scrubPII(event.extra)
  }

  if (event.contexts !== undefined) {
    event.contexts = scrubPII(event.contexts)
  }

  if (event.breadcrumbs !== undefined) {
    event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => ({
      ...breadcrumb,
      data: scrubPII(breadcrumb.data),
      message:
        typeof breadcrumb.message === 'string'
          ? scrubPII(breadcrumb.message)
          : breadcrumb.message,
    }))
  }

  return event
}
