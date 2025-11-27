/**
 * Delete confirmation modal component and helper.
 * Provides a standardized delete confirmation UI pattern.
 */

import { openConfirmModal } from '~/shared/modal/helpers/modalHelpers'

/**
 * Configuration for delete confirmation modals.
 */
export type DeleteConfirmModalConfig = {
  itemName: string
  itemType?: string
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  title?: string
  message?: string
}

/**
 * Opens a standardized delete confirmation modal.
 */
export function openDeleteConfirmModal(config: DeleteConfirmModalConfig) {
  const itemType = config.itemType ?? 'item'
  const title = config.title ?? `Excluir ${itemType}`
  const message =
    config.message ??
    `Tem certeza que deseja excluir ${itemType === 'item' ? 'o item' : itemType === 'receita' ? 'a receita' : `o ${itemType}`} "${config.itemName}"?`

  const modalId = openConfirmModal(message, {
    title,
    confirmText: 'Excluir',
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
