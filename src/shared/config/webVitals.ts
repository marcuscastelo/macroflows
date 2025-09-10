import { trace } from '@opentelemetry/api'
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals'

import { sentry } from '~/shared/config/sentry'
import { logging } from '~/shared/utils/logging'

type WebVitalsMetric = {
  name: string
  value: number
  delta: number
  id: string
  rating: 'good' | 'needs-improvement' | 'poor'
  entries: PerformanceEntry[]
}

type WebVitalsConfig = {
  enabled: boolean
  reportToSentry: boolean
  reportToConsole: boolean
  sampleRate: number
}

const getWebVitalsConfig = (): WebVitalsConfig => {
  const environment = import.meta.env.PROD ? 'production' : 'development'

  return {
    enabled: true,
    reportToSentry: sentry.isSentryEnabled(),
    reportToConsole: environment === 'development',
    sampleRate: environment === 'development' ? 1.0 : 1.0, // 100% sampling for comprehensive monitoring
  }
}

/**
 * Report Web Vitals metric to observability platforms
 */
const reportWebVital = (metric: WebVitalsMetric): void => {
  const config = getWebVitalsConfig()

  if (!config.enabled) return

  // Sample rate check
  if (Math.random() > config.sampleRate) return

  // Add to Sentry as breadcrumb for error correlation
  if (config.reportToSentry) {
    sentry.addBreadcrumb(
      `Web Vital: ${metric.name}`,
      'web-vitals',
      {
        metric_name: metric.name,
        value: metric.value,
        delta: metric.delta,
        rating: metric.rating,
        metric_id: metric.id,
      },
      metric.rating === 'poor' ? 'warning' : 'info',
    )

    // Also report as custom measurement to Sentry
    const activeSpan = trace.getActiveSpan()
    if (activeSpan) {
      activeSpan.setAttributes({
        [`webvitals.${metric.name.toLowerCase()}.value`]: metric.value,
        [`webvitals.${metric.name.toLowerCase()}.rating`]: metric.rating,
      })
    }
  }

  // Console logging for development
  if (config.reportToConsole) {
    const ratingEmoji = {
      good: '✅',
      'needs-improvement': '⚠️',
      poor: '❌',
    }[metric.rating]

    logging.info(
      `${ratingEmoji} Web Vital ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`,
      {
        metric,
        entries: metric.entries,
      },
    )
  }
}

/**
 * Initialize Web Vitals collection
 */
export const initializeWebVitals = (): void => {
  const config = getWebVitalsConfig()

  if (!config.enabled) {
    if (config.reportToConsole) {
      logging.info('Web Vitals collection disabled')
    }
    return
  }

  try {
    // Core Web Vitals - https://web.dev/vitals/
    onCLS(reportWebVital) // Cumulative Layout Shift
    onINP(reportWebVital) // Interaction to Next Paint (replaces FID)
    onLCP(reportWebVital) // Largest Contentful Paint

    // Additional Web Vitals for comprehensive monitoring
    onFCP(reportWebVital) // First Contentful Paint
    onTTFB(reportWebVital) // Time to First Byte

    if (config.reportToConsole) {
      logging.info('🚀 Web Vitals collection initialized', {
        reportToSentry: config.reportToSentry,
        sampleRate: config.sampleRate,
      })
    }
  } catch (error) {
    logging.error('Failed to initialize Web Vitals:', error)
    // Don't throw - Web Vitals should not break the application
  }
}

/**
 * Manual Web Vitals reporting for custom metrics
 */
export const reportCustomVital = (
  name: string,
  value: number,
  context?: Record<string, unknown>,
): void => {
  const config = getWebVitalsConfig()

  if (!config.enabled || !config.reportToSentry) return

  sentry.addBreadcrumb(
    `Custom Vital: ${name}`,
    'performance',
    {
      metric_name: name,
      value,
      ...context,
    },
    'info',
  )

  const activeSpan = trace.getActiveSpan()
  if (activeSpan) {
    activeSpan.setAttributes({
      [`custom.${name.toLowerCase()}.value`]: value,
      ...Object.fromEntries(
        Object.entries(context ?? {}).map(([k, v]) => [
          `custom.${name.toLowerCase()}.${k}`,
          typeof v === 'string' ||
          typeof v === 'number' ||
          typeof v === 'boolean'
            ? v
            : String(v),
        ]),
      ),
    })
  }

  if (config.reportToConsole) {
    logging.info(`📊 Custom Vital ${name}: ${value}`, context)
  }
}

export const webVitals = {
  initialize: initializeWebVitals,
  reportCustom: reportCustomVital,
  isEnabled: () => getWebVitalsConfig().enabled,
}
