import { metrics } from '@opentelemetry/api'
import { Resource } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'

import { APP_VERSION } from '~/app-version'

let isInitialized = false

export async function initializeMetricsProvider() {
  if (isInitialized) {
    console.warn('Metrics provider already initialized')
    return
  }

  try {
    const resource = Resource.default().merge(
      new Resource({
        [ATTR_SERVICE_NAME]: 'macroflows',
        [ATTR_SERVICE_VERSION]: APP_VERSION,
      }),
    )

    const { MeterProvider } = await import('@opentelemetry/sdk-metrics')
    const meterProvider = new MeterProvider({
      resource,
    })

    metrics.setGlobalMeterProvider(meterProvider)

    isInitialized = true
    console.log('✅ Metrics provider initialized successfully')
  } catch (error) {
    console.error('Failed to initialize metrics provider:', error)
  }
}

export function isMetricsInitialized(): boolean {
  return isInitialized
}
