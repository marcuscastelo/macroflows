import { createSignal, For } from 'solid-js'

import {
  showError,
  showSuccess,
} from '~/modules/toast/application/toastManager'
import {
  copyConsoleLogsToClipboard,
  downloadConsoleLogsAsFile,
  getConsoleLogs,
  shareConsoleLogs,
} from '~/shared/console/consoleInterceptor'
import { openContentModal } from '~/shared/modal/helpers/modalHelpers'
import { logging } from '~/shared/utils/logging'

export function ConsoleDumpButton() {
  const [processing, setProcessing] = createSignal(false)

  const handleAction = async (action: 'copy' | 'download' | 'share') => {
    try {
      setProcessing(true)
      const logs = getConsoleLogs()

      if (logs.length === 0) {
        showError('Nenhum log de console encontrado')
        return
      }

      switch (action) {
        case 'copy':
          await copyConsoleLogsToClipboard()
          showSuccess(`${logs.length} logs copiados para o clipboard`)
          break
        case 'download':
          downloadConsoleLogsAsFile()
          showSuccess(`${logs.length} logs salvos em arquivo`)
          break
        case 'share':
          await shareConsoleLogs()
          showSuccess(`${logs.length} logs compartilhados`)
          break
      }
    } catch (error) {
      logging.error(
        `Erro ao ${action === 'copy' ? 'copiar' : action === 'download' ? 'salvar' : 'compartilhar'} logs do console:`,
        error,
      )

      if (
        action === 'share' &&
        error instanceof Error &&
        error.message.includes('Share API')
      ) {
        showError(
          'Compartilhamento não suportado neste dispositivo. Tente copiar ou salvar.',
        )
      } else {
        showError(
          `Erro ao ${action === 'copy' ? 'copiar' : action === 'download' ? 'salvar' : 'compartilhar'} logs do console`,
        )
      }
    } finally {
      setProcessing(false)
    }
  }

  const openConsoleModal = () => {
    const logs = getConsoleLogs()

    if (logs.length === 0) {
      showError('Nenhum log de console encontrado')
      return
    }

    const actions: Array<{
      text: string
      onClick: () => void
      primary?: boolean
    }> = [
      {
        text: '📋 Copiar',
        onClick: () => void handleAction('copy'),
      },
      {
        text: '💾 Salvar',
        onClick: () => void handleAction('download'),
      },
    ]

    openContentModal(
      () => (
        <div class="flex flex-col gap-4">
          <p class="text-gray-200">
            {logs.length} logs encontrados. Como deseja exportar?
          </p>
          <div class="flex gap-2 flex-wrap">
            <For each={actions}>
              {(action) => (
                <button
                  type="button"
                  class={`btn cursor-pointer ${
                    action.primary === true ? 'btn-primary' : 'btn-ghost'
                  }`}
                  onClick={() => {
                    action.onClick()
                  }}
                >
                  {action.text}
                </button>
              )}
            </For>
          </div>
        </div>
      ),
      {
        title: 'Console Logs',
        closeOnOutsideClick: true,
      },
    )
  }

  return (
    <button
      type="button"
      class="btn cursor-pointer uppercase btn-secondary btn-xs"
      onClick={openConsoleModal}
      disabled={processing()}
      title="Exportar logs do console"
    >
      {processing() ? 'Processando...' : '📋 Console'}
    </button>
  )
}
