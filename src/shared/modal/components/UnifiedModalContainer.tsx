/**
 * Unified Modal Container component.
 * Renders all active modals using the existing Modal component.
 */

import { type Accessor, For, Show } from 'solid-js'

import { Modal } from '~/sections/common/components/Modal'
import { ModalErrorBoundary } from '~/shared/modal/components/ModalErrorBoundary'
import { modals } from '~/shared/modal/core/modalManager'
import { closeModal } from '~/shared/modal/helpers/modalHelpers'
import type { ModalState } from '~/shared/modal/types/modalTypes'

/**
 * Resolves a value that could be static or an Accessor.
 * For JSXElement types, this should NOT be used as JSXElement can be a function.
 */
function resolveStringValue<T extends string>(
  value: T | Accessor<T> | undefined,
): T | undefined {
  if (value === undefined) return undefined
  return typeof value === 'function' ? (value as Accessor<T>)() : value
}

/**
 * Renders individual modal content based on modal type.
 */
function ModalRenderer(props: ModalState) {
  const title = () => resolveStringValue(props.title)

  return (
    <Modal {...props}>
      <Show when={props.showCloseButton !== false}>
        <Modal.Header {...props}> {title()} </Modal.Header>
      </Show>
      <Show when={props.showCloseButton === false}>
        <div class="flex gap-4 justify-between items-center">
          <div class="flex-1">{title()}</div>
        </div>
      </Show>

      <Modal.Content>
        <ModalErrorBoundary modalId={props.id}>
          <Show when={props.type === 'error'}>
            <div class="error-modal">
              <div class="alert alert-error mb-4">
                <svg
                  class="stroke-current shrink-0 w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  {props.type === 'error' ? props.errorDetails.message : ''}
                </span>
              </div>
              <Show when={props.type === 'error' && props.errorDetails.stack}>
                <details class="mt-2">
                  <summary class="cursor-pointer text-sm text-gray-400 hover:text-white">
                    Show technical details
                  </summary>
                  <pre class="mt-2 text-xs bg-gray-900 p-3 rounded border border-gray-700 overflow-auto max-h-40">
                    {props.type === 'error' ? props.errorDetails.stack : ''}
                  </pre>
                </details>
              </Show>
            </div>
          </Show>

          <Show when={props.type === 'content'}>
            <div class="content-modal">
              {props.type === 'content'
                ? typeof props.content === 'function'
                  ? props.content(props.id)
                  : props.content
                : null}
            </div>
          </Show>

          <Show when={props.type === 'confirmation'}>
            <div class="confirmation-modal">
              <p class="mb-6 text-gray-200">
                {props.type === 'confirmation'
                  ? resolveStringValue(props.message)
                  : ''}
              </p>
            </div>
          </Show>
        </ModalErrorBoundary>
      </Modal.Content>

      <Show when={props.type === 'content' && props.footer}>
        <Modal.Footer>
          {props.type === 'content'
            ? typeof props.footer === 'function'
              ? props.footer()
              : props.footer
            : null}
        </Modal.Footer>
      </Show>

      <Show when={props.type === 'confirmation'}>
        <Modal.Footer>
          <button
            type="button"
            class="btn btn-ghost"
            onClick={() => {
              if (props.type === 'confirmation') {
                props.onCancel?.()
              }
              closeModal(props.id)
            }}
          >
            {props.type === 'confirmation'
              ? resolveStringValue(props.cancelText) ?? 'Cancel'
              : 'Cancel'}
          </button>
          <button
            type="button"
            class="btn btn-primary"
            onClick={() => {
              if (props.type === 'confirmation') {
                void props.onConfirm?.()
              }
              closeModal(props.id)
            }}
          >
            {props.type === 'confirmation'
              ? resolveStringValue(props.confirmText) ?? 'Confirm'
              : 'Confirm'}
          </button>
        </Modal.Footer>
      </Show>
    </Modal>
  )
}

/**
 * Main modal container component.
 * Renders all active modals using the Modal component.
 */
export function UnifiedModalContainer() {
  return (
    <div class="unified-modal-container">
      <For each={modals()}>
        {(modal) => (
          <Show when={modal.isOpen}>
            <ModalRenderer {...modal} />
          </Show>
        )}
      </For>
    </div>
  )
}

/**
 * Default export for convenience.
 */
export default UnifiedModalContainer
