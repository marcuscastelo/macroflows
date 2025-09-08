import '~/app.css'

import { Router } from '@solidjs/router'
import { FileRoutes } from '@solidjs/start/router'
import { createSignal, lazy, onCleanup, onMount, Suspense } from 'solid-js'

import { BackendOutageBanner } from '~/sections/common/components/BackendOutageBanner'
import { PageLoading } from '~/sections/common/components/PageLoading'
import { Providers } from '~/sections/common/context/Providers'
import {
  startConsoleInterception,
  stopConsoleInterception,
} from '~/shared/console/consoleInterceptor'
import { SentryErrorBoundary } from '~/shared/error/SentryErrorBoundary'

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

  onMount(() => {
    startConsoleInterception()
  })

  onCleanup(() => {
    stopConsoleInterception()
  })

  return (
    <SentryErrorBoundary>
      <Router
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
      </Router>
    </SentryErrorBoundary>
  )
}
