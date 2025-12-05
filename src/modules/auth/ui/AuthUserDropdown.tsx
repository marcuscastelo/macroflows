import { useNavigate } from '@solidjs/router'
import { Show } from 'solid-js'

import { authUseCases } from '~/modules/auth/application/usecases/authUseCases'
import { showError } from '~/modules/toast/application/toastManager'
import { Button } from '~/sections/common/components/buttons/Button'
import { UserIcon } from '~/sections/common/components/icons/UserIcon'
import {
  closeModal,
  openConfirmModal,
} from '~/shared/modal/helpers/modalHelpers'
import { logging } from '~/shared/utils/logging'
import { vibrate } from '~/shared/utils/vibrate'

export const AuthUserDropdown = (props: { modalId: string }) => {
  const navigate = useNavigate()

  const handleSignOut = () => {
    vibrate(50)
    openConfirmModal('Deseja sair da sua conta?', {
      title: 'Sair',
      confirmText: 'Sair',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          await authUseCases.signOut()
          closeModal(props.modalId)
          navigate('/login')
        } catch (error) {
          logging.error('Sign out error:', error)
          showError('Erro ao sair. Tente novamente.')
        }
      },
    })
  }

  const handleLogin = () => {
    closeModal(props.modalId)
    navigate('/login')
  }

  return (
    <div class="flex flex-col gap-2 min-w-64">
      {/* Authentication Status */}
      <Show
        when={authUseCases.isAuthenticated()}
        fallback={
          <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <div class="text-center">
              <p class="text-gray-600 dark:text-gray-400 mb-3">
                Você não está logado
              </p>
              <Button class="btn-primary btn-sm w-full" onClick={handleLogin}>
                Fazer Login
              </Button>
            </div>
          </div>
        }
      >
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <UserIcon
                userId={authUseCases.currentUserIdOrGuestId}
                userName={(): string => {
                  const authUser = authUseCases.getCurrentUser()
                  if (authUser !== null && authUser.email !== '') {
                    const emailParts = authUser.email.split('@')
                    return emailParts[0] ?? ''
                  }
                  return ''
                }}
                {...props}
              />
            </div>
            <div class="flex-1">
              <p class="font-medium text-gray-900 dark:text-white">
                {authUseCases.getCurrentUser()?.email}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Conectado via Google
              </p>
            </div>
          </div>
        </div>
      </Show>

      {/* Actions */}
      <Show when={authUseCases.isAuthenticated()}>
        <div class="p-2">
          <Button
            class="btn-ghost text-red-600 dark:text-red-400 w-full justify-start"
            onClick={handleSignOut}
          >
            <svg
              class="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>Sair da conta</title>
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sair da conta
          </Button>
        </div>
      </Show>
    </div>
  )
}
