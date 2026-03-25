import { createEffect, type JSXElement } from 'solid-js'

import { ContainerProvider, createContainer } from '~/di/container'
import { lazyImport } from '~/shared/solid/lazyImport'
import { logging } from '~/shared/utils/logging'

const { UnifiedModalContainer } = lazyImport(
  () => import('~/shared/modal/components/UnifiedModalContainer'),
  ['UnifiedModalContainer'],
)

const { DarkToaster } = lazyImport(
  () => import('~/sections/common/components/DarkToaster'),
  ['DarkToaster'],
)

export function Providers(props: { children: JSXElement }) {
  const container = createContainer()

  createEffect(() => {
    try {
      container.initialize()
    } catch (error) {
      logging.error('Failed to initialize app container', error)
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
