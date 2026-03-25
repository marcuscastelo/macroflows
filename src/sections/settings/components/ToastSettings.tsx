/**
 * Toast Settings Component
 *
 * A component for managing toast notification preferences.
 */
import { createSignal, onMount } from 'solid-js'

import {
  getToastSettings,
  resetToastSettings,
  updateToastSettings,
} from '~/modules/toast/application/toastSettings'

export function ToastSettings() {
  const [settings, setSettings] = createSignal(getToastSettings())
  const [saved, setSaved] = createSignal(false)

  // Refresh local settings when component mounts
  onMount(() => {
    setSettings(getToastSettings())
  })

  const saveSettings = () => {
    updateToastSettings(settings())
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleReset = () => {
    resetToastSettings()
    setSettings(getToastSettings())
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleChange = (field: string, value: boolean | number) => {
    setSettings((current) => ({ ...current, [field]: value }))
  }

  return (
    <div class="rounded-md bg-white p-4 shadow">
      <h3 class="text-lg font-medium mb-4">Configurações de Notificações</h3>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="block text-sm font-medium text-gray-700">
            Mostrar notificações de sucesso em segundo plano
          </label>
          <input
            type="checkbox"
            checked={settings().showBackgroundSuccess}
            onChange={(e) =>
              handleChange('showBackgroundSuccess', e.target.checked)
            }
            class="h-4 w-4 text-indigo-600 rounded"
          />
        </div>

        <div class="flex items-center justify-between">
          <label class="block text-sm font-medium text-gray-700">
            Mostrar notificações de carregamento em segundo plano
          </label>
          <input
            type="checkbox"
            checked={settings().showBackgroundLoading}
            onChange={(e) =>
              handleChange('showBackgroundLoading', e.target.checked)
            }
            class="h-4 w-4 text-indigo-600 rounded"
          />
        </div>

        <div class="flex items-center justify-between">
          <label class="block text-sm font-medium text-gray-700">
            Dispensar erros automaticamente
          </label>
          <input
            type="checkbox"
            checked={settings().autoDismissErrors}
            onChange={(e) =>
              handleChange('autoDismissErrors', e.target.checked)
            }
            class="h-4 w-4 text-indigo-600 rounded"
          />
        </div>

        <div class="flex items-center justify-between">
          <label class="block text-sm font-medium text-gray-700">
            Agrupar notificações similares
          </label>
          <input
            type="checkbox"
            checked={settings().groupSimilarToasts}
            onChange={(e) =>
              handleChange('groupSimilarToasts', e.target.checked)
            }
            class="h-4 w-4 text-indigo-600 rounded"
          />
        </div>

        <div class="flex items-center justify-between">
          <label class="block text-sm font-medium text-gray-700">
            Mostrar detalhes de erro
          </label>
          <input
            type="checkbox"
            checked={settings().showDetailedErrors}
            onChange={(e) =>
              handleChange('showDetailedErrors', e.target.checked)
            }
            class="h-4 w-4 text-indigo-600 rounded"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Duração padrão (ms)
          </label>
          <input
            type="number"
            min="1000"
            max="10000"
            step="1000"
            value={settings().defaultDuration}
            onChange={(e) =>
              handleChange('defaultDuration', parseInt(e.target.value, 10))
            }
            class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-hidden focus:ring-blue-400 focus:border-blue-400 sm:text-sm"
          />
        </div>
      </div>

      <div class="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={handleReset}
          class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-800 bg-white hover:bg-gray-100 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 cursor-pointer"
        >
          Restaurar padrões
        </button>

        <button
          type="button"
          onClick={saveSettings}
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-700 hover:bg-blue-800 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 cursor-pointer"
        >
          {saved() ? 'Salvo!' : 'Salvar mudanças'}
        </button>
      </div>
    </div>
  )
}
