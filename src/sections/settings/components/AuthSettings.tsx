import { useNavigate } from '@solidjs/router'
import { Show } from 'solid-js'

import { signOut } from '~/modules/auth/application/services/authService'
import {
  getCurrentUser,
  isAuthenticated,
} from '~/modules/auth/application/usecases/authState'
import {
  showError,
  showSuccess,
} from '~/modules/toast/application/toastManager'
import { Button } from '~/sections/common/components/buttons/Button'
import { openConfirmModal } from '~/shared/modal/helpers/modalHelpers'
import { logging } from '~/shared/utils/logging'

export function AuthSettings() {
  const navigate = useNavigate()

  const handleSignOut = () => {
    openConfirmModal('Deseja sair da sua conta?', {
      title: 'Sair',
      confirmText: 'Sair',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          await signOut()
          showSuccess('Logout realizado com sucesso')
          navigate('/login')
        } catch (error) {
          logging.error('Sign out error:', error)
          showError('Erro ao sair. Tente novamente.')
        }
      },
    })
  }

  const handleLogin = () => {
    navigate('/login')
  }

  return (
    <div class="space-y-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
        Conta e Autenticação
      </h2>

      <Show
        when={isAuthenticated()}
        fallback={
          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <div class="text-center">
              <svg
                class="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Não conectado
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Faça login para sincronizar seus dados e acessar recursos
                exclusivos
              </p>
              <div class="mt-6">
                <Button class="btn-primary" onClick={handleLogin}>
                  Fazer Login
                </Button>
              </div>
            </div>
          </div>
        }
      >
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div class="flex items-start space-x-4">
            <div class="flex-shrink-0">
              <div class="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <svg
                  class="h-6 w-6 text-blue-600 dark:text-blue-400"
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
            </div>
            <div class="flex-1 min-w-0">
              <div class="focus:outline-none">
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {getCurrentUser()?.email}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Conectado via Google OAuth
                </p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  ID: {getCurrentUser()?.id.slice(0, 8)}...
                </p>
              </div>
            </div>
          </div>

          <div class="mt-6 flex flex-col sm:flex-row gap-3">
            <Button
              class="btn-ghost text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
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
        </div>
      </Show>

      {/* Privacy & Data Section */}
      <Show when={isAuthenticated()}>
        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Privacidade e Dados
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Seus dados são sincronizados de forma segura e criptografada. Você
            pode exportar ou excluir seus dados a qualquer momento.
          </p>
        </div>
      </Show>
    </div>
  )
}
