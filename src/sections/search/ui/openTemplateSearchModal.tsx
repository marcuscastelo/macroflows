/**
 * Template search modal helper.
 * Opens the TemplateSearchModal using the modal system.
 */

import { refetchTemplates } from '~/modules/template-search/application/usecases/templateSearchState'
import {
  TemplateSearchModal,
  type TemplateSearchModalProps,
} from '~/sections/search/components/TemplateSearchModal'
import {
  closeModal,
  openContentModal,
} from '~/shared/modal/helpers/modalHelpers'

/**
 * Configuration for template search modals.
 */
export type TemplateSearchModalConfig = TemplateSearchModalProps & {
  title?: string
}

/**
 * Opens a template search modal.
 */
export function openTemplateSearchModal(config: TemplateSearchModalConfig) {
  const title = config.title ?? `Adicionar item - ${config.targetName}`

  const modalId = openContentModal(
    () => (
      <TemplateSearchModal
        targetName={config.targetName}
        onNewItem={config.onNewItem}
        onFinish={() => {
          config.onFinish?.()
          closeModal(modalId)
        }}
        onClose={() => {
          config.onClose?.()
          closeModal(modalId)
        }}
      />
    ),
    {
      title,
      onClose: () => {
        void refetchTemplates()
        config.onClose?.()
      },
    },
  )

  return modalId
}
