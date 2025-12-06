import { createEffect, type JSXElement } from 'solid-js'

import { ContainerProvider, createContainer } from '~/di/container'
import { useCases } from '~/di/useCases'
import { lazyImport } from '~/shared/solid/lazyImport'

const { UnifiedModalContainer } = lazyImport(
  () => import('~/shared/modal/components/UnifiedModalContainer'),
  ['UnifiedModalContainer'],
)

const { DarkToaster } = lazyImport(
  () => import('~/sections/common/components/DarkToaster'),
  ['DarkToaster'],
)

export function Providers(props: { children: JSXElement }) {
  // Create a stable container instance at app bootstrap time.
  // We reuse the existing legacy `useCases` implementations as overrides so
  // behavior remains unchanged while migrating to the new container shape.
  //
  // Wire the container directly from `useCases` without casting to intermediate types.
  const container = createContainer({
    authUseCases: useCases.authUseCases(),
    userUseCases: useCases.userUseCases(),
    guestUseCases: useCases.guestUseCases(),
  })

  // Initialize auth lifecycle (and other optional infra) once the provider is mounted.
  createEffect(() => {
    container.authUseCases.initializeAuth()
    if (container.initializeWeightRealtime) {
      try {
        container.initializeWeightRealtime()
      } catch (err) {
        // Keep bootstrap robust: log to console if realtime init fails during startup.
        // Prefer replacing with centralized logging when available.

        console.warn('Failed to initialize weight realtime', err)
      }
    }
  })

  return (
    <ContainerProvider value={container}>
      <DarkToaster />
      <UnifiedModalContainer />
      {props.children}
    </ContainerProvider>
  )
}
