import { createSignal } from 'solid-js'

import { createErrorHandler } from '~/shared/error/errorHandler'
import type {
  ModalConfig,
  ModalId,
  ModalManager,
  ModalState,
} from '~/shared/modal/types/modalTypes'
import { logging } from '~/shared/utils/logging'

export const [modals, setModals] = createSignal<ModalState[]>([])

const errorHandler = createErrorHandler('system', 'Modal')

function generateModalId(): ModalId {
  return `modal-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function performClose(id: ModalId, modal: ModalState): void {
  logging.debug(`Performing close for modal: ${id}`)
  setModals((prev) => prev.filter((m) => m.id !== id))
  modal.onClose?.()
}

export const modalManager: ModalManager = {
  openModal(config: ModalConfig): ModalId {
    let modalId: string
    if (config.id !== undefined && config.id.trim() !== '') {
      modalId = config.id.trim()
    } else {
      modalId = generateModalId()
    }
    const now = new Date()

    const [closing, setClosing] = createSignal(false)

    const modalState: ModalState = {
      ...config,
      id: modalId,
      isOpen: true,
      isClosing: closing,
      createdAt: now,
      updatedAt: now,
      priority: config.priority || 'normal',
      closeOnOutsideClick: config.closeOnOutsideClick ?? true,
      closeOnEscape: config.closeOnEscape ?? true,
      showCloseButton: config.showCloseButton ?? true,
      async beforeClose() {
        setClosing(true)
        const animationDelay =
          typeof window === 'undefined' || import.meta.env.MODE === 'test'
            ? 0
            : 100
        await new Promise((resolve) => setTimeout(resolve, animationDelay))
        return config.beforeClose?.() ?? true
      },
    }

    setModals((prev) => {
      const filtered = prev.filter((modal) => modal.id !== modalId)
      return [...filtered, modalState]
    })

    config.onOpen?.()

    return modalId
  },

  async closeModal(id: ModalId): Promise<void> {
    const modal = modals().find((m) => m.id === id)
    if (!modal) return

    try {
      const shouldClose = (await modal.beforeClose?.()) ?? true
      if (shouldClose) performClose(id, modal)
    } catch (e) {
      performClose(id, modal)
      errorHandler.criticalError(e, { operation: 'closeModalManager' })
    }
  },
}
