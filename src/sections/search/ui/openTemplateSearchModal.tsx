/**
 * Template search modal helper.
 * Opens the TemplateSearchModal using the modal system.
 */

import {
  TemplateSearchModal,
  type TemplateSearchModalProps,
} from '~/sections/search/components/TemplateSearchModal'
import {
  closeModal,
  openContentModal,
} from '~/shared/modal/helpers/modalHelpers'
import type { ModalId } from '~/shared/modal/types/modalTypes'

/**
 * Controller for managing a modal's lifecycle.
 */
export type ModalController = {
  modalId: ModalId
  close: () => void
}

/**
 * Configuration for template search modals.
 */
export type TemplateSearchModalConfig = TemplateSearchModalProps & {
  title?: string
}

/**
 * Opens a template search modal.
 */
export function openTemplateSearchModal(
  config: TemplateSearchModalConfig,
): ModalController {
  const title = config.title ?? `Adicionar item - ${config.targetName}`

  let controller: ModalController

  const modalId = openContentModal(
    () => (
      <TemplateSearchModal
        targetName={config.targetName}
        onNewItem={config.onNewItem}
        onFinish={() => {
          config.onFinish?.()
          controller.close()
        }}
        onClose={() => {
          config.onClose?.()
          controller.close()
        }}
      />
    ),
    {
      title,
      onClose: () => {
        config.onClose?.()
      },
    },
  )

  controller = {
    modalId,
    close: () => closeModal(modalId),
  }

  return controller
}
