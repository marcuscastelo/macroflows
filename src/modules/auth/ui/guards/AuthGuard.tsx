import { useNavigate } from '@solidjs/router'
import { createEffect, type JSXElement, Show } from 'solid-js'

import { authUseCases } from '~/modules/auth/application/usecases/authUseCases'
import { LoadingRing } from '~/sections/common/components/LoadingRing'
import { guestUseCases } from '~/shared/guest/guestUseCases'

type AuthGuardProps = {
  children: JSXElement
  fallback?: JSXElement
  redirectTo?: string
}

/**
 * Authentication guard component that protects routes requiring authentication.
 * In guest mode, allows access without redirecting to login.
 */
export function AuthGuard(props: AuthGuardProps) {
  const navigate = useNavigate()

  createEffect(() => {
    if (
      !authUseCases.isAuthLoading() &&
      !authUseCases.isAuthenticated() &&
      !guestUseCases.isGuestMode()
    ) {
      navigate(props.redirectTo ?? '/login')
    }
  })

  const showChildren = () =>
    authUseCases.isAuthenticated() || guestUseCases.isGuestMode()
  const isLoading = () => authUseCases.isAuthLoading()

  return (
    <Show
      when={!isLoading()}
      fallback={
        props.fallback ?? (
          <div class="min-h-screen flex items-center justify-center">
            <div class="text-center">
              <LoadingRing />
              <p class="text-gray-600 dark:text-gray-400 mt-4">
                Verificando autenticação...
              </p>
            </div>
          </div>
        )
      }
    >
      <Show when={showChildren()} fallback={null}>
        {props.children}
      </Show>
    </Show>
  )
}
