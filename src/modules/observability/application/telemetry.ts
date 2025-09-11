import { initializeSentry } from '~/modules/observability/infrastructure/sentry/sentry'

export function initializeTelemetry(type: 'server' | 'client') {
  void initializeSentry(type)
}
