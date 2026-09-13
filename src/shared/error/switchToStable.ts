import { isBackendOutageError } from '~/shared/utils/errorUtils'
import { logging } from '~/shared/utils/logging'

export type ReleaseChannel = 'stable' | 'canary' | 'rc' | 'unknown'

export type LocationLike = {
  origin: string
  hostname: string
  pathname: string
  search: string
  hash: string
}

export type SwitchSuggestionReason =
  | 'network'
  | 'server'
  | 'runtime'
  | 'recurring'
  | 'channel-mismatch'
  | 'unknown'

export type SwitchSuggestion = {
  shouldSuggest: boolean
  targetUrl: string
  reason: SwitchSuggestionReason
  severity: 'normal' | 'elevated'
  releaseChannel: ReleaseChannel
  errorSignature: string
}

export type SwitchToStableConfig = {
  enabled: boolean
  stableBaseUrl?: string
  repeatThreshold: number
  repeatWindowMs: number
}

const DEFAULT_REPEAT_THRESHOLD = 2
const DEFAULT_REPEAT_WINDOW_MS = 5 * 60 * 1000

export const DEFAULT_SWITCH_TO_STABLE_CONFIG: SwitchToStableConfig = {
  enabled: true,
  repeatThreshold: DEFAULT_REPEAT_THRESHOLD,
  repeatWindowMs: DEFAULT_REPEAT_WINDOW_MS,
}

const ERROR_HISTORY = new Map<string, number[]>()

const normalizeChannel = (value?: string | null): ReleaseChannel | null => {
  if (typeof value !== 'string') return null
  const lower = value.toLowerCase()
  if (lower.startsWith('canary')) return 'canary'
  if (lower.startsWith('rc')) return 'rc'
  if (lower.startsWith('stable')) return 'stable'
  return null
}

export const detectReleaseChannel = (params: {
  envChannel?: string | null
  appVersion?: string
  hostname?: string
}): ReleaseChannel => {
  const envChannel = normalizeChannel(params.envChannel)
  if (envChannel !== null) return envChannel

  const version = params.appVersion ?? ''
  if (version.includes('-canary')) return 'canary'
  if (version.includes('-rc') || version.includes('rc')) return 'rc'

  const hostname = params.hostname?.toLowerCase() ?? ''
  if (hostname.includes('canary')) return 'canary'
  if (hostname.includes('rc')) return 'rc'

  return 'stable'
}

const isUserActionableError = (status?: number): boolean => {
  if (status === undefined) return false
  if (status >= 500) return false
  return status >= 400 && status < 500
}

const getStatusFromError = (error: unknown): number | undefined => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number'
  ) {
    return error.status
  }

  if (error instanceof Response) {
    return error.status
  }

  return undefined
}

const isRuntimeCandidate = (error: unknown): boolean => {
  if (error instanceof Error) return true
  if (typeof error === 'string') return true
  return false
}

const buildErrorSignature = (error: unknown): string => {
  if (typeof error === 'string') return error
  if (error instanceof Error) {
    const message = error.message
    const stackLine = error.stack?.split('\n')[0] ?? 'no-stack'
    return `${message}:${stackLine}`
  }
  if (typeof error === 'object' && error !== null) {
    const message =
      'message' in error && typeof error.message === 'string'
        ? error.message
        : JSON.stringify(error)
    return message
  }
  return 'unknown'
}

const recordOccurrence = (
  signature: string,
  config: SwitchToStableConfig,
  now: number,
): { count: number; isRecurring: boolean } => {
  const timestamps = ERROR_HISTORY.get(signature) ?? []
  const windowStart = now - config.repeatWindowMs
  const withinWindow = timestamps.filter((ts) => ts >= windowStart)
  const updated = [...withinWindow, now]
  ERROR_HISTORY.set(signature, updated)
  const count = updated.length
  return {
    count,
    isRecurring: count >= config.repeatThreshold,
  }
}

export const deriveStableBaseUrl = (
  location: LocationLike,
  override?: string,
): string => {
  if (typeof override === 'string' && override.length > 0) return override

  const lowered = location.hostname.toLowerCase()
  const stripped = lowered
    .replace(/^canary[.-]/, '')
    .replace(/^rc[.-]/, '')
    .replace(/-canary/, '')
    .replace(/-rc/, '')

  if (stripped !== lowered) {
    const url = new URL(location.origin)
    url.hostname = stripped
    return url.origin
  }

  return location.origin
}

export const buildStableUrl = (
  location: LocationLike,
  stableBaseUrl?: string,
): string => {
  const base = deriveStableBaseUrl(location, stableBaseUrl)
  return `${base}${location.pathname}${location.search}${location.hash}`
}

export const evaluateSwitchSuggestion = (params: {
  error: unknown
  location?: LocationLike
  releaseChannel: ReleaseChannel
  config?: Partial<SwitchToStableConfig>
  now?: () => number
}): SwitchSuggestion => {
  const config: SwitchToStableConfig = {
    ...DEFAULT_SWITCH_TO_STABLE_CONFIG,
    ...params.config,
  }

  const location = params.location

  const targetUrl =
    location !== undefined ? buildStableUrl(location, config.stableBaseUrl) : ''

  if (!config.enabled) {
    return {
      shouldSuggest: false,
      reason: 'unknown',
      severity: 'normal',
      targetUrl,
      releaseChannel: params.releaseChannel,
      errorSignature: 'disabled',
    }
  }

  if (params.releaseChannel === 'stable') {
    return {
      shouldSuggest: false,
      reason: 'channel-mismatch',
      severity: 'normal',
      targetUrl,
      releaseChannel: params.releaseChannel,
      errorSignature: 'stable-channel',
    }
  }

  const status = getStatusFromError(params.error)
  if (isUserActionableError(status)) {
    return {
      shouldSuggest: false,
      reason: 'unknown',
      severity: 'normal',
      targetUrl,
      releaseChannel: params.releaseChannel,
      errorSignature: 'user-actionable',
    }
  }

  const signature = buildErrorSignature(params.error)
  const now = params.now?.() ?? Date.now()
  const recurrence = recordOccurrence(signature, config, now)

  const isNetwork = isBackendOutageError(params.error)
  const isServer = typeof status === 'number' && status >= 500
  const runtimeCandidate = isRuntimeCandidate(params.error)

  if (!isNetwork && !isServer && !runtimeCandidate) {
    return {
      shouldSuggest: false,
      reason: 'unknown',
      severity: 'normal',
      targetUrl,
      releaseChannel: params.releaseChannel,
      errorSignature: signature,
    }
  }

  const reason: SwitchSuggestionReason = recurrence.isRecurring
    ? 'recurring'
    : isNetwork
      ? 'network'
      : isServer
        ? 'server'
        : 'runtime'

  logging.warn('Switch to stable suggestion evaluated', {
    reason,
    releaseChannel: params.releaseChannel,
    targetUrl,
    signature,
    isNetwork,
    isServer,
    recurrenceCount: recurrence.count,
  })

  return {
    shouldSuggest: true,
    reason,
    severity: recurrence.isRecurring ? 'elevated' : 'normal',
    targetUrl,
    releaseChannel: params.releaseChannel,
    errorSignature: signature,
  }
}
