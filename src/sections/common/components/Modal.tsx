import { createEffect, createSignal, type JSXElement, Show } from 'solid-js'

import { Button } from '~/sections/common/components/buttons/Button'
import { DarkToaster } from '~/sections/common/components/DarkToaster'
import { cn } from '~/shared/cn'
import { closeModal } from '~/shared/modal/helpers/modalHelpers'
import { type ModalState } from '~/shared/modal/types/modalTypes'
import { logging } from '~/shared/utils/logging'

export type ModalProps = ModalState & {
  children: JSXElement
}

export const Modal = (props: ModalProps) => {
  const [active, setActive] = createSignal(false)
  createEffect(() => {
    logging.debug(
      `Modal ${props.id} isOpen: ${props.isOpen}, isClosing: ${props.isClosing()} isActive: ${active()}`,
    )
    let timeoutId
    if (props.isOpen && !props.isClosing() && !active()) {
      timeoutId = setTimeout(() => {
        setActive(true)
        setTimeout(() => {}, 300) // Duration of the modal animation
      }, 10)
    } else if (props.isClosing() && active()) {
      timeoutId = null
      setActive(false)
    } else {
      logging.debug(`Modal ${props.id} is not active, no action taken`)
      timeoutId = null
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  })

  const handleCloseModal = () => {
    closeModal(props.id)
  }

  const handleClose = (e: Event) => {
    handleCloseModal()
    e.stopPropagation()
    e.preventDefault()
    return false
  }

  const modalClass = () =>
    cn('modal modal-bottom sm:modal-middle', {
      'modal-active': active(),
    })

  return (
    <dialog
      id={`modal-${props.id}`}
      ref={(ref) => {
        createEffect(() => {
          if (props.isOpen) {
            ref.showModal()
          } else {
            ref.close()
          }
        })
      }}
      class={modalClass()}
    >
      <DarkToaster />
      <div class={cn('modal-box bg-gray-800 text-white')}>{props.children}</div>
      <Show when={props.closeOnOutsideClick}>
        <div onClick={handleClose} class="modal-backdrop" />
      </Show>
    </dialog>
  )
}

function ModalHeader(
  props: ModalState & {
    children: JSXElement
    /** Callback fired when close button is clicked */
  },
) {
  const handleClose = () => {
    closeModal(props.id)
  }

  return (
    <div class="flex gap-4 justify-between items-center">
      <div class="flex-1">{props.children}</div>
      <div class="shrink">
        <Button
          type="button"
          class="btn-ghost bg-transparent border-none shadow-none rounded-md p-1 active:scale-[1.2] hover:scale-[1.4] transition-transform"
          onClick={handleClose}
          aria-label="Close modal"
        >
          <svg
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </Button>
      </div>
    </div>
  )
}

function ModalContent(props: { children: JSXElement }) {
  return <div class="modal-content">{props.children}</div>
}

function ModalFooter(props: { children: JSXElement }) {
  return <div class="modal-action">{props.children}</div>
}

// Compound component pattern
Modal.Header = ModalHeader
Modal.Content = ModalContent
Modal.Footer = ModalFooter
