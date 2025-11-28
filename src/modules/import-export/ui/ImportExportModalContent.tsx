import { createSignal, For, Show } from 'solid-js'

import { downloadExport } from '~/modules/import-export/application/exportUtils'
import { regeneratePayloadIds } from '~/modules/import-export/application/idRegeneration'
import {
  generateImportPreview,
  type ImportPreview,
  type ImportValidationError,
  validateImportPayload,
} from '~/modules/import-export/application/importValidation'
import { type ExportPayload } from '~/modules/import-export/domain/exportPayload'
import {
  showError,
  showSuccess,
} from '~/modules/toast/application/toastManager'
import { Button } from '~/sections/common/components/buttons/Button'
import { cn } from '~/shared/cn'
import { closeModal } from '~/shared/modal/helpers/modalHelpers'

type Tab = 'export' | 'import'

type ImportExportModalContentProps = {
  modalId: string
  /**
   * Optional data for export (for context-specific exports).
   * If provided, allows exporting specific data directly.
   */
  exportData?: ExportPayload
  /**
   * Callback when import is completed successfully.
   */
  onImportComplete?: (payload: ExportPayload) => void
}

/**
 * Modal content component for Import/Export functionality.
 * This is the content to be rendered inside a unified modal.
 */
export function ImportExportModalContent(props: ImportExportModalContentProps) {
  const [activeTab, setActiveTab] = createSignal<Tab>('export')
  const [jsonInput, setJsonInput] = createSignal('')
  const [validationErrors, setValidationErrors] = createSignal<
    ImportValidationError[]
  >([])
  const [validationWarnings, setValidationWarnings] = createSignal<string[]>([])
  const [parsedPayload, setParsedPayload] = createSignal<ExportPayload | null>(
    null,
  )
  const [preview, setPreview] = createSignal<ImportPreview | null>(null)
  const [regenerateIds, setRegenerateIds] = createSignal(true)
  const [isValidating, setIsValidating] = createSignal(false)

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab)
    // Clear validation state when switching tabs
    setValidationErrors([])
    setValidationWarnings([])
    setParsedPayload(null)
    setPreview(null)
  }

  const handleValidate = () => {
    const input = jsonInput().trim()
    if (!input) {
      setValidationErrors([
        {
          path: '',
          message: 'Por favor, insira o conteúdo JSON para importar',
          code: 'empty_input',
        },
      ])
      return
    }

    setIsValidating(true)
    try {
      const result = validateImportPayload(input)

      if (!result.success) {
        setValidationErrors(result.errors)
        setParsedPayload(null)
        setPreview(null)
      } else {
        setValidationErrors([])
        setValidationWarnings(result.warnings)
        setParsedPayload(result.data)
        setPreview(generateImportPreview(result.data))
      }
    } finally {
      setIsValidating(false)
    }
  }

  const handleImport = () => {
    const payload = parsedPayload()
    if (!payload) {
      showError('Nenhum dado válido para importar')
      return
    }

    try {
      const finalPayload = regenerateIds()
        ? regeneratePayloadIds(payload)
        : payload

      props.onImportComplete?.(finalPayload)
      showSuccess('Dados importados com sucesso!')
      closeModal(props.modalId)
    } catch (_error) {
      showError('Erro ao importar dados')
    }
  }

  const handleExport = () => {
    const data = props.exportData
    if (data === undefined) {
      showError('Nenhum dado disponível para exportar')
      return
    }

    try {
      downloadExport(data)
      showSuccess('Dados exportados com sucesso!')
    } catch (_error) {
      showError('Erro ao exportar dados')
    }
  }

  const handleFileUpload = async (
    event: Event & { currentTarget: HTMLInputElement },
  ) => {
    const file = event.currentTarget.files?.[0]
    if (file === undefined) return

    try {
      const text = await file.text()
      setJsonInput(text)
      handleValidate()
    } catch (_error) {
      showError('Erro ao ler arquivo')
    }
  }

  return (
    <div class="min-w-[300px] sm:min-w-[400px]">
      {/* Tabs */}
      <div class="flex text-font-medium text-center text-gray-500 divide-x divide-gray-600 rounded-lg shadow dark:divide-gray-600 dark:text-gray-300 bg-gray-900 dark:bg-gray-900 mb-4">
        <TabButton
          label="Exportar"
          isActive={activeTab() === 'export'}
          onClick={() => handleTabClick('export')}
          isFirst
        />
        <TabButton
          label="Importar"
          isActive={activeTab() === 'import'}
          onClick={() => handleTabClick('import')}
          isLast
        />
      </div>

      {/* Export Tab Content */}
      <Show when={activeTab() === 'export'}>
        <div class="space-y-4">
          <div class="bg-gray-700 rounded-lg p-4">
            <h3 class="text-sm font-medium text-white mb-2">
              Exportar seus dados
            </h3>
            <p class="text-xs text-gray-400 mb-4">
              Exporte seus dados em formato JSON para backup ou migração. Os
              dados exportados incluem metadados de versão para garantir
              compatibilidade.
            </p>

            <Show
              when={props.exportData}
              fallback={
                <div class="text-center py-4 text-gray-400">
                  <p class="text-sm">Nenhum dado selecionado para exportar.</p>
                  <p class="text-xs mt-1">
                    Acesse esta funcionalidade a partir de uma refeição, receita
                    ou dia específico.
                  </p>
                </div>
              }
            >
              {(exportData) => (
                <div class="space-y-3">
                  <div class="bg-gray-800 rounded p-3">
                    <div class="text-sm text-gray-300">
                      <span class="font-medium">Escopo:</span>{' '}
                      {getScopeLabel(exportData().metadata.scope)}
                    </div>
                    <div class="text-xs text-gray-400 mt-1">
                      Versão do esquema: {exportData().metadata.schemaVersion}
                    </div>
                  </div>

                  <Button class="btn-primary w-full" onClick={handleExport}>
                    <DownloadIcon />
                    Baixar JSON
                  </Button>
                </div>
              )}
            </Show>
          </div>

          {/* Privacy Notice */}
          <div class="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3">
            <div class="flex items-start gap-2">
              <WarningIcon />
              <div>
                <h4 class="text-xs font-medium text-yellow-400">
                  Aviso de Privacidade
                </h4>
                <p class="text-xs text-yellow-300/80 mt-1">
                  O arquivo exportado pode conter dados pessoais como nomes de
                  alimentos, refeições e informações nutricionais. Guarde-o em
                  local seguro.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Show>

      {/* Import Tab Content */}
      <Show when={activeTab() === 'import'}>
        <div class="space-y-4">
          {/* File Upload */}
          <div class="bg-gray-700 rounded-lg p-4">
            <h3 class="text-sm font-medium text-white mb-2">Importar dados</h3>
            <p class="text-xs text-gray-400 mb-4">
              Cole o conteúdo JSON ou faça upload de um arquivo para importar
              dados.
            </p>

            <div class="space-y-3">
              {/* File input */}
              <label class="flex flex-col items-center justify-center w-full h-20 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700 transition-colors">
                <div class="flex flex-col items-center justify-center pt-2 pb-2">
                  <UploadIcon />
                  <p class="text-xs text-gray-400 mt-1">
                    Clique ou arraste um arquivo JSON
                  </p>
                </div>
                <input
                  type="file"
                  class="hidden"
                  accept=".json,application/json"
                  onChange={(e) => void handleFileUpload(e)}
                />
              </label>

              {/* Text area */}
              <div>
                <label class="block text-xs text-gray-400 mb-1">
                  Ou cole o conteúdo JSON:
                </label>
                <textarea
                  class="w-full h-32 bg-gray-800 border border-gray-600 rounded-lg p-3 text-xs text-gray-200 font-mono resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder='{"metadata": {...}, "data": {...}}'
                  value={jsonInput()}
                  onInput={(e) => setJsonInput(e.currentTarget.value)}
                />
              </div>

              <Button
                class="btn-secondary w-full"
                onClick={handleValidate}
                disabled={isValidating() || !jsonInput().trim()}
              >
                {isValidating() ? 'Validando...' : 'Validar JSON'}
              </Button>
            </div>
          </div>

          {/* Validation Errors */}
          <Show when={validationErrors().length > 0}>
            <div class="bg-red-900/30 border border-red-700 rounded-lg p-3">
              <h4 class="text-xs font-medium text-red-400 mb-2">
                Erros de validação
              </h4>
              <ul class="space-y-1">
                <For each={validationErrors()}>
                  {(error) => (
                    <li class="text-xs text-red-300">
                      {error.path ? `${error.path}: ` : ''}
                      {error.message}
                    </li>
                  )}
                </For>
              </ul>
            </div>
          </Show>

          {/* Validation Warnings */}
          <Show when={validationWarnings().length > 0}>
            <div class="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3">
              <h4 class="text-xs font-medium text-yellow-400 mb-2">Avisos</h4>
              <ul class="space-y-1">
                <For each={validationWarnings()}>
                  {(warning) => (
                    <li class="text-xs text-yellow-300">{warning}</li>
                  )}
                </For>
              </ul>
            </div>
          </Show>

          {/* Preview */}
          <Show when={preview()}>
            {(previewData) => (
              <div class="bg-green-900/30 border border-green-700 rounded-lg p-3">
                <h4 class="text-xs font-medium text-green-400 mb-2">
                  Prévia da importação
                </h4>
                <div class="space-y-2">
                  <div class="text-sm text-green-300">
                    {previewData().summary}
                  </div>
                  <ul class="space-y-1">
                    <For each={previewData().details}>
                      {(detail) => (
                        <li class="text-xs text-green-300/80">• {detail}</li>
                      )}
                    </For>
                  </ul>
                </div>
              </div>
            )}
          </Show>

          {/* Import Options */}
          <Show when={parsedPayload()}>
            <div class="bg-gray-700 rounded-lg p-4 space-y-3">
              <h4 class="text-sm font-medium text-white">
                Opções de importação
              </h4>

              {/* Regenerate IDs checkbox */}
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={regenerateIds()}
                  onChange={(e) => setRegenerateIds(e.currentTarget.checked)}
                  class="w-4 h-4 accent-blue-600 rounded"
                />
                <div>
                  <span class="text-sm text-gray-200">Regenerar IDs</span>
                  <p class="text-xs text-gray-400">
                    Gera novos IDs para evitar conflitos com dados existentes
                    (recomendado)
                  </p>
                </div>
              </label>

              {/* Privacy Warning */}
              <div class="bg-yellow-900/30 border border-yellow-700 rounded p-2">
                <p class="text-xs text-yellow-300">
                  <strong>Atenção:</strong> Esta ação irá adicionar os dados
                  importados ao seu perfil. Certifique-se de que o conteúdo é de
                  uma fonte confiável.
                </p>
              </div>

              <Button class="btn-primary w-full" onClick={handleImport}>
                <ImportIcon />
                Importar dados
              </Button>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  )
}

// Helper components

function TabButton(props: {
  label: string
  isActive: boolean
  onClick: () => void
  isFirst?: boolean
  isLast?: boolean
}) {
  const handleClick = () => {
    props.onClick()
  }

  return (
    <button
      type="button"
      class={cn('flex-1 px-4 py-2 text-sm font-medium transition-colors', {
        'text-white bg-blue-700 dark:bg-blue-800 border-b-4 border-blue-400':
          props.isActive,
        'text-gray-400 hover:text-white hover:bg-gray-800': !props.isActive,
        'rounded-tl-lg rounded-bl-lg': props.isFirst,
        'rounded-tr-lg rounded-br-lg': props.isLast,
      })}
      onClick={handleClick}
    >
      {props.label}
    </button>
  )
}

function getScopeLabel(scope: string): string {
  switch (scope) {
    case 'meal':
      return 'Refeição'
    case 'recipe':
      return 'Receita'
    case 'day':
      return 'Dia'
    case 'full':
      return 'Exportação Completa'
    default:
      return scope
  }
}

// Icon components

function DownloadIcon() {
  return (
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
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg
      class="w-6 h-6 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
      />
    </svg>
  )
}

function ImportIcon() {
  return (
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
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
      />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg
      class="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  )
}
