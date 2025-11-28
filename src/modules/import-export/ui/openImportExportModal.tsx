import { type ExportPayload } from '~/modules/import-export/domain/exportPayload'
import { ImportExportModalContent } from '~/modules/import-export/ui/ImportExportModalContent'
import { openContentModal } from '~/shared/modal/helpers/modalHelpers'

type OpenImportExportModalOptions = {
  /**
   * Optional data for export (for context-specific exports).
   */
  exportData?: ExportPayload
  /**
   * Callback when import is completed successfully.
   */
  onImportComplete?: (payload: ExportPayload) => void
}

/**
 * Opens the Import/Export modal.
 */
export function openImportExportModal(
  options: OpenImportExportModalOptions = {},
): void {
  openContentModal(
    (modalId) => (
      <ImportExportModalContent
        modalId={modalId}
        exportData={options.exportData}
        onImportComplete={options.onImportComplete}
      />
    ),
    {
      title: 'Importar / Exportar Dados',
      closeOnOutsideClick: false,
      closeOnEscape: true,
      showCloseButton: true,
    },
  )
}
