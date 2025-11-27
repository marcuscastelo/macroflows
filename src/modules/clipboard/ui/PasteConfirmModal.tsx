import { type ClipboardPayload } from '~/modules/clipboard/domain/clipboardEntry'
import { ClipboardPayloadExt } from '~/modules/clipboard/domain/clipboardPayloadExt'
import { type Item } from '~/modules/diet/item/schema/itemSchema'
import { ItemListView } from '~/sections/item/components/ItemListView'
import { openContentModal } from '~/shared/modal/helpers/modalHelpers'
import { closeModal } from '~/shared/modal/helpers/modalHelpers'
import { logging } from '~/shared/utils/logging'

export const openPasteConfirmModal = <T extends ClipboardPayload>(
  payload: T,
  onPasteConfirmed: (data: T) => void,
) => {
  try {
    const extractedItems = () => ClipboardPayloadExt.extractItems(payload)

    openContentModal(() => <PasteConfirmModal items={extractedItems()} />, {
      title: 'Colar itens',
      footer: (modalId) => (
        <PasteConfirmModalFooter
          modalId={modalId}
          onPasteConfirmed={() => onPasteConfirmed(payload)}
        />
      ),
      closeOnOutsideClick: false,
      closeOnEscape: true,
      showCloseButton: true,
    })

    return
  } catch (err) {
    logging.warn('Preview validation failed, falling back to confirm modal', {
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

function PasteConfirmModal(props: { items: Item[] }) {
  return (
    <div>
      <div class="mb-4">{`Os seguintes itens serão colados:`}</div>
      <ItemListView items={() => props.items} handlers={{}} />
    </div>
  )
}

function PasteConfirmModalFooter(props: {
  modalId: string
  onPasteConfirmed: () => void
}) {
  return (
    <div class="flex gap-2 justify-end">
      <button
        type="button"
        class="btn btn-ghost"
        onClick={() => {
          closeModal(props.modalId)
        }}
      >
        Cancelar
      </button>
      <button
        type="button"
        class="btn btn-primary"
        onClick={() => {
          props.onPasteConfirmed()
          closeModal(props.modalId)
        }}
      >
        Colar
      </button>
    </div>
  )
}
