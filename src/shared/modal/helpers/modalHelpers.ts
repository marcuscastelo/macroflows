/**
 * Helper functions for common modal patterns using the unified modal system.
 * These provide convenient APIs for frequently used modal operations.
 */

import type { Accessor } from 'solid-js'

import { modalManager } from '~/shared/modal/core/modalManager'
import type {
  MaybeAccessor,
  ModalBody,
  ModalId,
  ModalPriority,
  ModalTitle,
} from '~/shared/modal/types/modalTypes'
import { logging } from '~/shared/utils/logging'

/**
 * Opens a confirmation modal with standardized styling and behavior.
 *
 * @param message The confirmation message to display (can be static string or Accessor<string>)
 * @param options Configuration for the confirmation modal
 * @returns The modal ID for tracking
 */

export function openConfirmModal(
  message: MaybeAccessor<string>,
  options: {
    title?: MaybeAccessor<ModalTitle>
    confirmText?: MaybeAccessor<string>
    cancelText?: MaybeAccessor<string>
    onConfirm: () => void | Promise<void>
    onCancel?: () => void
    priority?: ModalPriority
  },
): ModalId {
  try {
    return modalManager.openModal({
      type: 'confirmation',
      title: options.title ?? 'Confirm Action',
      message,
      confirmText: options.confirmText ?? 'Confirm',
      cancelText: options.cancelText ?? 'Cancel',
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
      priority: options.priority ?? 'normal',
      closeOnOutsideClick: false,
      closeOnEscape: true,
      showCloseButton: true,
    })
  } catch (e) {
    logging.error('Modal openConfirmModal error:', e)
    throw e
  }
}

/**
 * Opens a content modal with standardized styling and behavior.
 *
 * @param content The JSX content to display in the modal (can be element or factory function that receives modalId)
 * @param options Configuration for the content modal
 * @returns The modal ID for tracking
 */
export function openContentModal(
  content: ModalBody | ((modalId: ModalId) => ModalBody),
  options: {
    title?: MaybeAccessor<ModalTitle>
    priority?: ModalPriority
    closeOnOutsideClick?: boolean
    closeOnEscape?: boolean
    showCloseButton?: boolean
    footer?: MaybeAccessor<ModalBody>
    onClose?: () => void
  } = {},
): ModalId {
  try {
    return modalManager.openModal({
      type: 'content',
      title: options.title,
      content,
      footer: options.footer,
      priority: options.priority ?? 'normal',
      closeOnOutsideClick: options.closeOnOutsideClick ?? true,
      closeOnEscape: options.closeOnEscape ?? true,
      showCloseButton: options.showCloseButton ?? true,
      onClose: options.onClose,
    })
  } catch (e) {
    logging.error('Modal openContentModal error:', e)
    throw e
  }
}

/**
 * Opens an edit modal with standardized styling optimized for editing forms.
 *
 * @param content The edit form content to display (can be element or factory function that receives modalId)
 * @param options Configuration for the edit modal
 * @returns The modal ID for tracking
 */
export function openEditModal(
  content: ModalBody | ((modalId: ModalId) => ModalBody),
  options: {
    title: MaybeAccessor<ModalTitle>
    targetName?: string
    onClose?: () => void
    onSave?: () => void
    onCancel?: () => void
  },
): ModalId {
  try {
    let fullTitle: MaybeAccessor<ModalTitle>

    if (options.targetName !== undefined && options.targetName.length > 0) {
      if (typeof options.title === 'function') {
        fullTitle = () =>
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          `${(options.title as Accessor<ModalTitle>)()} - ${options.targetName}`
      } else {
        fullTitle = `${options.title} - ${options.targetName}`
      }
    } else {
      fullTitle = options.title
    }

    return modalManager.openModal({
      type: 'content',
      title: fullTitle,
      content,
      priority: 'normal',
      closeOnOutsideClick: false,
      closeOnEscape: false,
      showCloseButton: true,
      onClose: options.onClose,
    })
  } catch (e) {
    logging.error('Modal openEditModal error:', e)
    throw e
  }
}

/**
 * Closes a modal by ID with optional callback.
 *
 * @param modalId The ID of the modal to close
 * @param onClose Optional callback to execute after closing
 */
export function closeModal(modalId: ModalId, onClose?: () => void): void {
  try {
    void modalManager.closeModal(modalId)
    onClose?.()
  } catch (e) {
    logging.error('Modal closeModalHelper error:', e)
    throw e
  }
}
