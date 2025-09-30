import type { Accessor, JSXElement } from 'solid-js'

import type { ToastError } from '~/modules/toast/domain/toastTypes'

export type ModalId = string
export type ModalPriority = 'low' | 'normal' | 'high' | 'critical'
export type ModalTitle = string
export type ModalBody = JSXElement

export type BaseModalConfig = {
  id?: ModalId
  title?: ModalTitle | Accessor<ModalTitle>
  priority?: ModalPriority
  closeOnOutsideClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  onOpen?: () => void
  onClose?: () => void
  beforeClose?: () => Promise<boolean>
}

export type ErrorModalConfig = BaseModalConfig & {
  type: 'error'
  errorDetails: ToastError
}

export type ContentModalConfig = BaseModalConfig & {
  type: 'content'
  content: ModalBody | ((modalId: ModalId) => ModalBody)
  footer?: ModalBody | Accessor<ModalBody>
}

export type ConfirmationModalConfig = BaseModalConfig & {
  type: 'confirmation'
  message: string | Accessor<string>
  confirmText?: string | Accessor<string>
  cancelText?: string | Accessor<string>
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
}

export type ModalConfig =
  | ErrorModalConfig
  | ContentModalConfig
  | ConfirmationModalConfig

export type ModalState = ModalConfig & {
  id: ModalId
  isOpen: boolean
  isClosing: Accessor<boolean>
  createdAt: Date
  updatedAt: Date
}

export type ModalManager = {
  openModal: (config: ModalConfig) => ModalId
  closeModal: (id: ModalId) => Promise<void>
}
