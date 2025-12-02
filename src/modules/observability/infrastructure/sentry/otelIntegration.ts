import { context, propagation, trace } from '@opentelemetry/api'
import { BasicTracerProvider } from '@opentelemetry/sdk-trace-base'
import * as SentryOTel from '@sentry/opentelemetry'
import * as Sentry from '@sentry/solidstart'

export async function setupSentryOTelIntegration(type: 'server' | 'client') {
  const client = Sentry.getClient()
  if (client === undefined) {
    console.warn('Sentry OTel Fatal Error: Sentry client is undefined')
    return
  }
  SentryOTel.setupEventContextTrace(client)

  const provider = new BasicTracerProvider({
    sampler: new SentryOTel.SentrySampler(client),
    spanProcessors: [new SentryOTel.SentrySpanProcessor()],
  })

  const SentryContextManager = await wrapContextManagerClass(type)

  trace.setGlobalTracerProvider(provider)
  propagation.setGlobalPropagator(new SentryOTel.SentryPropagator())
  context.setGlobalContextManager(new SentryContextManager())

  SentryOTel.setOpenTelemetryContextAsyncContextStrategy()
}

async function wrapContextManagerClass(type: 'server' | 'client') {
  if (type === 'client') {
    const { ZoneContextManager } = await import('@opentelemetry/context-zone')
    return SentryOTel.wrapContextManagerClass(ZoneContextManager)
  } else {
    const { AsyncLocalStorageContextManager } =
      await import('@opentelemetry/context-async-hooks')
    return SentryOTel.wrapContextManagerClass(AsyncLocalStorageContextManager)
  }
}
