/**
 * Item edit modal helper.
 * Opens the ItemEditModal using the modal system.
 */

import {
  ItemEditModal,
  type ItemEditModalProps,
} from '~/sections/item/components/ItemView/ItemEdit/ItemEditModal'
import { closeModal, openEditModal } from '~/shared/modal/helpers/modalHelpers'
import type { ModalId } from '~/shared/modal/types/modalTypes'

/**
 * Controller for managing a modal's lifecycle.
 */
export type ModalController = {
  modalId: ModalId
  close: () => void
}

/**
 * Configuration for item edit modals.
 */
export type ItemEditModalConfig = ItemEditModalProps & {
  title?: string
  targetName?: string
}

/**
 * Opens an item edit modal.
 */
export function openItemEditModal(
  config: ItemEditModalConfig,
): ModalController {
  const title = config.title ?? 'Editar Item'

  let controller: ModalController

  const modalId = openEditModal(
    () => (
      <ItemEditModal
        targetMealName={config.targetMealName}
        targetNameColor={config.targetNameColor}
        item={config.item}
        macroOverflow={config.macroOverflow}
        onApply={(item) => {
          config.onApply(item)
          controller.close()
        }}
        onCancel={() => {
          config.onCancel?.()
          controller.close()
        }}
        onClose={() => {
          config.onClose?.()
          controller.close()
        }}
        showAddItemButton={config.showAddItemButton}
        onAddNewItem={config.onAddNewItem}
      />
    ),
    {
      title,
      targetName: config.targetName,
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
