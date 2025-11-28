import { openImportExportModal } from '~/modules/import-export/ui/openImportExportModal'
import { Button } from '~/sections/common/components/buttons/Button'

/**
 * Data management settings section.
 * Provides access to Import/Export functionality.
 */
export function DataSettings() {
  const handleOpenImportExport = () => {
    openImportExportModal({
      onImportComplete: (payload) => {
        // TODO: Implement actual data import logic
        // This would integrate with the diet store to add imported data
        console.log('Import completed:', payload.metadata.scope)
      },
    })
  }

  return (
    <div class="space-y-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
        Gerenciamento de Dados
      </h2>

      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
          Importar / Exportar
        </h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Exporte seus dados para backup ou migração, ou importe dados de um
          arquivo JSON previamente exportado.
        </p>
        <Button class="btn-secondary" onClick={handleOpenImportExport}>
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
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
          Abrir Importar / Exportar
        </Button>
      </div>

      <div class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <svg
            class="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h4 class="text-sm font-medium text-blue-800 dark:text-blue-300">
              Sobre seus dados
            </h4>
            <p class="text-xs text-blue-700 dark:text-blue-400 mt-1">
              Seus dados incluem refeições, receitas, dietas diárias e
              configurações. Ao exportar, você receberá um arquivo JSON que pode
              ser usado para:
            </p>
            <ul class="text-xs text-blue-700 dark:text-blue-400 mt-2 space-y-1 list-disc list-inside">
              <li>Fazer backup dos seus dados</li>
              <li>Migrar para outro dispositivo</li>
              <li>Compartilhar configurações com outras pessoas</li>
              <li>Atender solicitações LGPD de portabilidade de dados</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
