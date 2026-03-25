import '~/app.css'

import * as Sentry from '@sentry/solidstart'
import { withSentryRouterRouting } from '@sentry/solidstart/solidrouter'
import { Router } from '@solidjs/router'
import { FileRoutes } from '@solidjs/start/router'
import {
  createSignal,
  ErrorBoundary,
  For,
  lazy,
  onCleanup,
  onMount,
  Show,
  Suspense,
} from 'solid-js'

import { APP_VERSION } from '~/app-version'
import { BackendOutageBanner } from '~/sections/common/components/BackendOutageBanner'
import { PageLoading } from '~/sections/common/components/PageLoading'
import { SwitchToStablePrompt } from '~/sections/common/components/SwitchToStablePrompt'
import { Providers } from '~/sections/common/context/Providers'
import { GuestDataWarning } from '~/sections/settings/components/GuestDataWarning'
import env from '~/shared/config/env'
import {
  DEFAULT_SWITCH_TO_STABLE_CONFIG,
  detectReleaseChannel,
  evaluateSwitchSuggestion,
} from '~/shared/error/switchToStable'
import { logging } from '~/shared/utils/logging'

const SentryRouter = withSentryRouterRouting(Router)

const SentryErrorBoundary = Sentry.withSentryErrorBoundary(ErrorBoundary)

const BottomNavigation = lazy(async () => ({
  default: (await import('~/sections/common/components/BottomNavigation'))
    .BottomNavigation,
}))

function useAspectWidth() {
  const [width, setWidth] = createSignal(getWidth())

  function getWidth() {
    return Math.min((window.innerHeight * 14) / 16, window.innerWidth)
  }
  function onResize() {
    setWidth(getWidth())
  }
  window.addEventListener('resize', onResize)
  onCleanup(() => window.removeEventListener('resize', onResize))
  return width
}

/**
 * App root layout for all routes. Wraps children with global providers and Suspense.
 * @param props - Children to render inside providers
 * @returns App layout
 */
export default function App() {
  const width = useAspectWidth()

  return (
    <SentryErrorBoundary
      fallback={(err) => {
        onMount(() => {
          console.error('Uncaught error in App:', err)
          logging.error('Uncaught error in App', err)
        })

        const releaseChannel = detectReleaseChannel({
          envChannel: env.VITE_RELEASE_CHANNEL,
          appVersion: APP_VERSION,
          hostname:
            typeof window !== 'undefined'
              ? window.location.hostname
              : undefined,
        })

        const location =
          typeof window !== 'undefined'
            ? {
                origin: window.location.origin,
                hostname: window.location.hostname,
                pathname: window.location.pathname,
                search: window.location.search,
                hash: window.location.hash,
              }
            : undefined

        const suggestion = evaluateSwitchSuggestion({
          error: err,
          location,
          releaseChannel,
          config: {
            enabled:
              env.VITE_SWITCH_TO_STABLE_ENABLED ??
              DEFAULT_SWITCH_TO_STABLE_CONFIG.enabled,
            stableBaseUrl: env.VITE_STABLE_BASE_URL,
            repeatThreshold:
              env.VITE_SWITCH_REPEAT_THRESHOLD ??
              DEFAULT_SWITCH_TO_STABLE_CONFIG.repeatThreshold,
            repeatWindowMs:
              env.VITE_SWITCH_REPEAT_WINDOW_MS ??
              DEFAULT_SWITCH_TO_STABLE_CONFIG.repeatWindowMs,
          },
        })

        const [showLegacy, setShowLegacy] = createSignal(false)

        const detailMessage =
          err instanceof Error ? err.message : String(err ?? 'Unknown error')

        const trackPrompt = (action: string) => {
          logging.info(`switch-to-stable.${action}`, {
            reason: suggestion.reason,
            targetUrl: suggestion.targetUrl,
            releaseChannel: suggestion.releaseChannel,
            errorSignature: suggestion.errorSignature,
            severity: suggestion.severity,
          })
          Sentry.captureMessage(`switch-to-stable.${action}`, {
            level: 'info',
            extra: {
              reason: suggestion.reason,
              targetUrl: suggestion.targetUrl,
              releaseChannel: suggestion.releaseChannel,
              signature: suggestion.errorSignature,
              severity: suggestion.severity,
            },
          })
        }

        onMount(() => {
          if (suggestion.shouldSuggest) {
            trackPrompt('shown')
          }
        })

        const handleSwitch = () => {
          trackPrompt('switch')
          if (suggestion.targetUrl !== '' && typeof window !== 'undefined') {
            window.location.href = suggestion.targetUrl
          }
        }

        const handleSecondary = () => {
          trackPrompt('secondary')
          if (
            suggestion.reason === 'network' &&
            typeof window !== 'undefined'
          ) {
            window.location.reload()
          } else {
            Sentry.captureException(err)
          }
        }

        const handleDismiss = () => {
          trackPrompt('dismiss')
          setShowLegacy(true)
        }

        const legacyContent = (
          <div class="p-4">
            <p>
              An unexpected error occurred:{' '}
              {err instanceof Error ? err.message : String(err)}
            </p>

            <pre class="text-xs text-gray-300 ml-3 mt-5 ">
              Stack:{'\n '}
              {err instanceof Error
                ? (() => {
                    const raw = err.stack ?? ''
                    const lines = raw
                      .split('\n')
                      .map((l) => l.trim())
                      .filter(Boolean)

                    type Frame = {
                      name: string
                      location: string
                      line: string
                    }

                    const frames: Frame[] = lines.map((line) => {
                      let m = line.match(
                        /^\s*at\s+(.*?)\s+\((.*?):(\d+):\d+\)\s*$/,
                      )
                      if (m)
                        return {
                          name: (m[1] ?? '') || '<anonymous>',
                          location: m[2] ?? '',
                          line: m[3] ?? '',
                        }

                      m = line.match(/^(.*?)@(.*?):(\d+):\d+\s*$/)
                      if (m)
                        return {
                          name: (m[1] ?? '') || '<anonymous>',
                          location: m[2] ?? '',
                          line: m[3] ?? '',
                        }

                      m = line.match(/^\s*at\s+(.*?):(\d+):\d+\s*$/)
                      if (m)
                        return {
                          name: '<anonymous>',
                          location: m[1] ?? '',
                          line: m[2] ?? '',
                        }

                      return { name: line, location: '', line: '' }
                    })

                    return (
                      <Show
                        when={frames.length > 0}
                        fallback="No stack available"
                      >
                        <div class="overflow-auto mt-2">
                          <table class="w-full text-xs table-auto border-collapse">
                            <thead>
                              <tr class="text-left text-gray-400">
                                <th class="pb-1 pr-4">Name</th>
                                <th class="pb-1 pr-4">Location</th>
                                <th class="pb-1">Line</th>
                              </tr>
                            </thead>
                            <tbody>
                              <For each={frames}>
                                {(f, i) => (
                                  <tr class={i() % 2 ? 'bg-gray-900' : ''}>
                                    <td class="align-top pr-4 whitespace-nowrap">
                                      {f.name}
                                    </td>
                                    <td class="align-top pr-4 wrap-break-word">
                                      <a
                                        href={`vscode://file/${env.VITE_DEBUG_CWD}/${f.location.replace(/^.*[\\/]_build\//, '')}:${f.line}`}
                                      >
                                        {f.location.replace(
                                          /^.*[\\/]_build\//,
                                          '',
                                        )}
                                      </a>
                                    </td>
                                    <td class="align-top">{f.line}</td>
                                  </tr>
                                )}
                              </For>
                            </tbody>
                          </table>
                        </div>
                      </Show>
                    )
                  })()
                : 'No stack available'}
            </pre>
          </div>
        )

        if (!suggestion.shouldSuggest) return legacyContent

        return (
          <Show when={!showLegacy()} fallback={legacyContent}>
            <SwitchToStablePrompt
              suggestion={suggestion}
              stableUrl={suggestion.targetUrl}
              details={detailMessage}
              onSwitch={handleSwitch}
              onSecondary={handleSecondary}
              onDismiss={handleDismiss}
            />
          </Show>
        )
      }}
    >
      <SentryRouter
        root={(props) => (
          <>
            <Suspense fallback={<PageLoading message="Iniciando app..." />}>
              <Providers>
                <BackendOutageBanner />
                <div
                  class="mx-auto flex flex-col justify-between bg-black h-screen w-screen rounded-none"
                  style={{ width: `${width()}px` }}
                >
                  <div class="mx-auto w-full flex flex-col justify-between p-1 px-1 -mt-5 sm:mt-0 sm:px-5">
                    <GuestDataWarning />
                    {props.children}
                  </div>
                  <BottomNavigation />
                </div>
              </Providers>
            </Suspense>
          </>
        )}
      >
        <FileRoutes />
      </SentryRouter>
    </SentryErrorBoundary>
  )
}
