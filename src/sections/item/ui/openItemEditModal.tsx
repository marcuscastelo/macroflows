/**
 * Item edit modal helper.
 * Opens the ItemEditModal using the modal system.
 */

import {
  ItemEditModal,
  type ItemEditModalProps,
} from '~/sections/item/components/ItemView/ItemEdit/ItemEditModal'
import { closeModal, openEditModal } from '~/shared/modal/helpers/modalHelpers'

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
export function openItemEditModal(config: ItemEditModalConfig) {
  const title = config.title ?? 'Editar Item'

  const modalId = openEditModal(
    () => (
      <ItemEditModal
        targetMealName={config.targetMealName}
        targetNameColor={config.targetNameColor}
        item={config.item}
        macroOverflow={config.macroOverflow}
        onApply={(item) => {
          config.onApply(item)
          closeModal(modalId)
        }}
        onCancel={() => {
          config.onCancel?.()
          closeModal(modalId)
        }}
        onClose={() => {
          config.onClose?.()
          closeModal(modalId)
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

  return modalId
}
