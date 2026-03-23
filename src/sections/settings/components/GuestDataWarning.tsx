import { useLocation, useNavigate } from '@solidjs/router'
import { Show } from 'solid-js'

import { useCases } from '~/di/useCases'
import {
  showError,
  showSuccess,
} from '~/modules/toast/application/toastManager'
import { Button } from '~/sections/common/components/buttons/Button'
import { resetGuestDatabase } from '~/shared/guest/guestDatabase'
import { logging } from '~/shared/utils/logging'

export function GuestDataWarning() {
  const navigate = useNavigate()
  const location = useLocation()
  const guestUseCases = useCases.guestUseCases()

  const handleResetDemoData = () => {
    try {
      resetGuestDatabase()
      showSuccess(
        'Dados demo resetados! Recarregue a página para ver as mudanças.',
      )
      // Navigate to diet page to refresh data
      navigate('/diet', { replace: true })
    } catch (error) {
      logging.error('Failed to reset demo data:', error)
      showError('Erro ao resetar dados demo.')
    }
  }

  const handleExitGuestMode = () => {
    try {
      guestUseCases.exitGuestMode(() => {
        showSuccess('Modo demo desativado! Você pode fazer login agora.')
        navigate('/login', { replace: true })
      })
    } catch (error) {
      logging.error('Failed to exit guest mode:', error)
      showError('Erro ao sair do modo demo.')
    }
  }

  return (
    <Show when={guestUseCases.isGuestMode() && location.pathname !== '/login'}>
      <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
        <h2 class="text-xl font-semibold mb-2 text-yellow-800 dark:text-yellow-200">
          Modo Demo
        </h2>
        <p class="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
          Você está usando o aplicativo em modo demo. Os dados são armazenados
          apenas localmente e serão perdidos ao limpar o cache do navegador.
        </p>

        <div class="flex flex-col gap-3">
          <Button
            type="button"
            class="w-full bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100 hover:bg-yellow-200 dark:hover:bg-yellow-700 py-2 px-4 rounded-lg font-medium transition-colors"
            onClick={handleResetDemoData}
          >
            🔄 Resetar dados demo
          </Button>

          <Button
            type="button"
            class="w-full bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-700 py-2 px-4 rounded-lg font-medium transition-colors"
            onClick={handleExitGuestMode}
          >
            🔐 Fazer login
          </Button>
        </div>
      </div>
    </Show>
  )
}
