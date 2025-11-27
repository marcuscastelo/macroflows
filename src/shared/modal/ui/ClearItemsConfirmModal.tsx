/**
 * Clear items confirmation modal component and helper.
 * Provides a standardized clear items confirmation UI pattern.
 */

import { openConfirmModal } from '~/shared/modal/helpers/modalHelpers'

/**
 * Configuration for clear items confirmation modals.
 */
export type ClearItemsConfirmModalConfig = {
  context?: string
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  title?: string
  message?: string
}

/**
 * Opens a standardized clear items confirmation modal.
 */
export function openClearItemsConfirmModal(
  config: ClearItemsConfirmModalConfig,
) {
  const context = config.context ?? 'os itens'
  const title = config.title ?? 'Limpar itens'
  const message = config.message ?? `Tem certeza que deseja limpar ${context}?`

  const modalId = openConfirmModal(message, {
    title,
    confirmText: 'Limpar',
    cancelText: 'Cancelar',
    onConfirm: async () => {
      await config.onConfirm()
    },
    onCancel: () => {
      config.onCancel?.()
    },
  })

  return modalId
}
