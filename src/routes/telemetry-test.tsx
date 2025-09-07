import type { Component } from 'solid-js'
import { createSignal, Show } from 'solid-js'

import {
  addBreadcrumb,
  isSentryEnabled,
  setUserContext,
} from '~/shared/config/sentry'
import { createErrorHandler } from '~/shared/error/errorHandler'
import { withUISpan } from '~/shared/utils/tracing'

const TelemetryTestPage: Component = () => {
  const [lastAction, setLastAction] = createSignal('')
  const errorHandler = createErrorHandler('application', 'TelemetryTest')

  const testSentryError = () => {
    try {
      console.log('🧪 Testing Sentry error...')
      throw new Error('Test error for Sentry integration')
    } catch (error) {
      console.log('📤 Sending error via errorHandler...')
      errorHandler.error(error, {
        operation: 'testSentryError',
        additionalData: {
          testType: 'manual',
          timestamp: new Date().toISOString(),
        },
      })
      setLastAction('Error sent to Sentry + OpenTelemetry')
    }
  }

  const testDirectSentry = () => {
    console.log('🎯 Testing direct Sentry call...')
    void import('@sentry/solidstart').then((Sentry) => {
      Sentry.captureException(new Error('Direct Sentry test error'), {
        tags: { source: 'direct_test' },
        extra: { timestamp: new Date().toISOString() },
      })
      setLastAction('Direct Sentry error sent')
      console.log('✅ Direct error sent to Sentry')
    })
  }

  const testOpenTelemetrySpan = () => {
    void withUISpan('TelemetryTest', 'testSpan', (span) => {
      span.setAttributes({
        'test.type': 'manual',
        'test.user_action': 'button_click',
      })

      // Simulate some work
      const start = Date.now()
      while (Date.now() - start < 100) {
        // busy wait for 100ms
      }

      span.addEvent('work_completed', {
        duration_ms: Date.now() - start,
      })

      setLastAction('OpenTelemetry span created with events')
    })
  }

  const testSentryBreadcrumbs = () => {
    addBreadcrumb('User clicked breadcrumb test', 'user_action', {
      component: 'TelemetryTestPage',
      action: 'testSentryBreadcrumbs',
    })
    setLastAction('Breadcrumb added to Sentry')
  }

  const testUserContext = () => {
    setUserContext({
      id: 'test-user-123',
      email: 'test@macroflows.app',
      name: 'Test User',
    })
    setLastAction('User context set in Sentry')
  }

  const testComplexFlow = () => {
    void withUISpan('TelemetryTest', 'complexFlow', async (span) => {
      try {
        span.setAttributes({
          'flow.type': 'complex_test',
          'flow.steps': 3,
        })

        // Step 1: Add breadcrumb
        addBreadcrumb('Complex flow started', 'flow', { step: 1 })
        span.addEvent('step_1_completed')

        // Step 2: Simulate async operation
        await new Promise((resolve) => setTimeout(resolve, 200))
        addBreadcrumb('Async operation completed', 'flow', { step: 2 })
        span.addEvent('step_2_completed')

        // Step 3: Intentional error for testing correlation
        const testError = new Error('Complex flow test error')
        throw testError
      } catch (error) {
        span.addEvent('error_occurred', { step: 3 })
        errorHandler.error(error, {
          operation: 'testComplexFlow',
          additionalData: {
            flowStep: 3,
            correlationId: 'flow-123',
          },
        })
        setLastAction('Complex flow completed with correlated error')
      }
    })
  }

  return (
    <div class="container mx-auto p-8">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold mb-8">Telemetry & Observability Test</h1>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Card */}
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title">Integration Status</h2>
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <div
                    class={`badge ${isSentryEnabled() ? 'badge-success' : 'badge-error'}`}
                  >
                    {isSentryEnabled() ? '✓' : '✗'}
                  </div>
                  <span>Sentry Integration</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="badge badge-success">✓</div>
                  <span>OpenTelemetry Tracing</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="badge badge-success">✓</div>
                  <span>Error Handler Integration</span>
                </div>
              </div>
              <Show when={lastAction()}>
                <div class="alert alert-info mt-4">
                  <span class="text-sm">{lastAction()}</span>
                </div>
              </Show>
            </div>
          </div>

          {/* Test Controls */}
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title">Test Actions</h2>
              <div class="space-y-3">
                <button
                  class="btn btn-error btn-sm w-full"
                  onClick={testSentryError}
                >
                  Test Error Tracking
                </button>

                <button
                  class="btn btn-outline btn-error btn-sm w-full"
                  onClick={testDirectSentry}
                >
                  Test Direct Sentry
                </button>

                <button
                  class="btn btn-primary btn-sm w-full"
                  onClick={testOpenTelemetrySpan}
                >
                  Test OpenTelemetry Span
                </button>

                <button
                  class="btn btn-secondary btn-sm w-full"
                  onClick={testSentryBreadcrumbs}
                >
                  Test Breadcrumbs
                </button>

                <button
                  class="btn btn-accent btn-sm w-full"
                  onClick={testUserContext}
                >
                  Set User Context
                </button>

                <button
                  class="btn btn-warning btn-sm w-full"
                  onClick={testComplexFlow}
                >
                  Test Complex Flow
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Setup Instructions */}
        <div class="card bg-base-100 shadow-xl mt-8">
          <div class="card-body">
            <h2 class="card-title">Setup Instructions</h2>
            <div class="prose max-w-none">
              <h3>1. Criar projeto no Sentry</h3>
              <ol>
                <li>
                  Acesse{' '}
                  <a href="https://sentry.io" target="_blank" rel="noopener">
                    sentry.io
                  </a>
                </li>
                <li>Crie uma conta/faça login</li>
                <li>Crie um novo projeto: "JavaScript" → "Browser"</li>
                <li>Copie o DSN fornecido</li>
              </ol>

              <h3>2. Configurar variáveis de ambiente</h3>
              <div class="mockup-code">
                <pre>
                  <code>
                    # .env.local
                    VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
                  </code>
                </pre>
              </div>

              <h3>3. Verificar integração</h3>
              <ol>
                <li>Reinicie o servidor de desenvolvimento</li>
                <li>Clique em "Test Error Tracking"</li>
                <li>Verifique o dashboard do Sentry</li>
                <li>Observe a correlação com traces OpenTelemetry</li>
              </ol>

              <h3>4. Features disponíveis</h3>
              <ul>
                <li>
                  <strong>Error Tracking:</strong> Erros automaticamente
                  enviados com contexto completo
                </li>
                <li>
                  <strong>Performance Monitoring:</strong> Traces de requisições
                  e interações com SolidJS Router
                </li>
                <li>
                  <strong>Session Replay:</strong> Gravação de sessões para
                  debug
                </li>
                <li>
                  <strong>Breadcrumbs:</strong> Trail de ações do usuário antes
                  dos erros
                </li>
                <li>
                  <strong>OpenTelemetry Correlation:</strong> Trace IDs
                  correlacionados entre sistemas
                </li>
                <li>
                  <strong>User Context:</strong> Informações do usuário anexadas
                  aos erros
                </li>
                <li>
                  <strong>SolidStart Integration:</strong> SDK nativo para
                  SolidJS
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TelemetryTestPage
