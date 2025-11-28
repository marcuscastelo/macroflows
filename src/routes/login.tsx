import { useNavigate } from '@solidjs/router'
import { createSignal, Show } from 'solid-js'

import { signIn } from '~/modules/auth/application/services/authService'
import { isAuthLoading } from '~/modules/auth/application/usecases/authState'
import { showError } from '~/modules/toast/application/toastManager'
import { Button } from '~/sections/common/components/buttons/Button'
import { LoadingRing } from '~/sections/common/components/LoadingRing'
import { GuestGuard } from '~/shared/guards/GuestGuard'
import { logging } from '~/shared/utils/logging'

export default function LoginPage() {
  const navigate = useNavigate()
  const [isSigningIn, setIsSigningIn] = createSignal(false)

  const handleGoogleLogin = async () => {
    setIsSigningIn(true)
    try {
      await signIn({
        provider: 'google',
        redirectTo: window.location.origin,
      })
      // Navigation will happen automatically when auth state changes
    } catch (error) {
      logging.error('Login error:', error)
      showError('Erro ao fazer login. Tente novamente.')
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleGuestMode = () => {
    navigate('/diet')
  }

  return (
    <GuestGuard>
      <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div class="max-w-md w-full">
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            {/* Header */}
            <div class="text-center mb-8">
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Bem-vindo ao Macroflows
              </h1>
              <p class="text-gray-600 dark:text-gray-400">
                Controle suas macros de forma inteligente
              </p>
            </div>

            {/* Loading State */}
            <Show when={isAuthLoading()}>
              <div class="flex flex-col items-center justify-center py-8">
                <LoadingRing />
                <p class="text-gray-600 dark:text-gray-400 mt-4">
                  Verificando autenticação...
                </p>
              </div>
            </Show>

            {/* Login Form */}
            <Show when={!isAuthLoading()}>
              <div class="space-y-6">
                {/* Google Login Button */}
                <Button
                  type="button"
                  class="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => void handleGoogleLogin()}
                  disabled={isSigningIn()}
                >
                  <Show
                    when={isSigningIn()}
                    fallback={
                      <svg class="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    }
                  >
                    <LoadingRing class="w-4 h-4" />
                  </Show>
                  <span>
                    {isSigningIn() ? 'Entrando...' : 'Entrar com Google'}
                  </span>
                </Button>

                {/* Divider */}
                <div class="relative">
                  <div class="absolute inset-0 flex items-center">
                    <div class="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                  <div class="relative flex justify-center text-sm">
                    <span class="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      ou
                    </span>
                  </div>
                </div>

                {/* Guest Mode */}
                <Button
                  type="button"
                  class="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 py-3 px-4 rounded-lg font-medium transition-colors"
                  onClick={handleGuestMode}
                >
                  Continuar sem login
                </Button>
              </div>

              {/* Footer */}
              <div class="mt-8 text-center">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Ao entrar, você concorda com nossos{' '}
                  <a
                    href="#"
                    class="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Termos de Uso
                  </a>{' '}
                  e{' '}
                  <a
                    href="#"
                    class="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Política de Privacidade
                  </a>
                </p>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </GuestGuard>
  )
}
