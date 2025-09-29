import { useNavigate } from '@solidjs/router'
import { createEffect, For, Show } from 'solid-js'

import { signOut } from '~/modules/auth/application/services/authService'
import {
  getCurrentUser,
  isAuthenticated,
} from '~/modules/auth/application/usecases/authState'
import { showError } from '~/modules/toast/application/toastManager'
import {
  changeToUser,
  currentUserId,
  fetchUsers,
  users,
} from '~/modules/user/application/user'
import { type User } from '~/modules/user/domain/user'
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

  createEffect(() => {
    const modalId = props.modalId
    fetchUsers().catch((error) => {
      logging.error('AuthUserDropdown error:', error)
      showError('Erro ao buscar usuários', { context: 'background' })
      closeModal(modalId)
    })
  })

  const handleChangeUser = (user: User) => {
    vibrate(50)
    openConfirmModal(`Deseja entrar como ${user.name}?`, {
      title: 'Trocar de usuário',
      confirmText: 'Entrar',
      cancelText: 'Cancelar',
      onConfirm: () => {
        vibrate(50)
        changeToUser(user.id)
        closeModal(props.modalId)
      },
    })
  }

  const handleSignOut = () => {
    vibrate(50)
    openConfirmModal('Deseja sair da sua conta?', {
      title: 'Sair',
      confirmText: 'Sair',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          await signOut()
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
        when={isAuthenticated()}
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
              <svg
                class="w-6 h-6 text-blue-600 dark:text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="flex-1">
              <p class="font-medium text-gray-900 dark:text-white">
                {getCurrentUser()?.email}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Conectado via Google
              </p>
            </div>
          </div>
        </div>
      </Show>

      {/* Local Users Section */}
      <div class="p-2">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 px-2">
          Usuários Locais
        </h3>
        <div class="flex flex-col gap-1">
          <For each={users()}>
            {(user) => (
              <Button
                class="btn-ghost flex justify-between items-center p-2 rounded-lg"
                onClick={() => {
                  handleChangeUser(user)
                  // Force dropdown to close without having to click outside setting aria
                  // Credit: https://reacthustle.com/blog/how-to-close-daisyui-dropdown-with-one-click
                  const dropdown =
                    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                    document.activeElement as HTMLAnchorElement | null
                  dropdown?.blur()
                }}
              >
                <UserIcon
                  class="w-8 h-8"
                  userId={() => user.id}
                  userName={() => user.name}
                />
                <div class="flex-1 text-left ml-3">
                  <div class="font-medium">{user.name}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {user.id === currentUserId() ? 'Usuário atual' : 'Trocar'}
                  </div>
                </div>
                <Show when={user.id === currentUserId()}>
                  <div class="w-2 h-2 bg-green-500 rounded-full" />
                </Show>
              </Button>
            )}
          </For>
        </div>
      </div>

      {/* Actions */}
      <Show when={isAuthenticated()}>
        <div class="p-2 border-t border-gray-200 dark:border-gray-700">
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
