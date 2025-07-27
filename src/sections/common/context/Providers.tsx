import { createEffect, type JSXElement } from 'solid-js'

import { initializeAuth } from '~/modules/auth/application/auth'
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
  // Initialize authentication system
  createEffect(() => {
    initializeAuth()
  })

  return (
    <>
      <DarkToaster />
      <UnifiedModalContainer />
      {props.children}
    </>
  )
}
