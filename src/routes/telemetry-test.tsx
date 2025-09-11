import type { Component } from 'solid-js'

import { logging } from '~/shared/utils/logging'

const TelemetryTestPage: Component = () => {
  const testSentryError = () => {
    logging.info('🧪 Testing Sentry error...')
    throw new Error('Test error for Sentry integration')
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
                  <div class="badge badge-success">✓</div>
                  <span>OpenTelemetry Tracing</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="badge badge-success">✓</div>
                  <span>Error Handler Integration</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="badge badge-success">✓</div>
                  <span>Web Vitals (Built-in with Sentry)</span>
                </div>
              </div>
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
