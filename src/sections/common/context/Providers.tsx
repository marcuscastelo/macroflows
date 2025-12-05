import { createEffect, type JSXElement } from 'solid-js'

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
  const authUseCases = useCases.authUseCases()
  // Initialize authentication system
  createEffect(() => {
    authUseCases.initializeAuth()
  })

  return (
    <>
      <DarkToaster />
      <UnifiedModalContainer />
      {props.children}
    </>
  )
}
