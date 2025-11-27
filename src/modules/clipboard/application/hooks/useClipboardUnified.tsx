import { createRoot, createSignal } from 'solid-js'
import { type z } from 'zod/v4'

import { createClipboardStore } from '~/modules/clipboard/application/store/clipboardStore'
import { type ClipboardPayload } from '~/modules/clipboard/domain/clipboardEntry'
import { createNoOpPersistence } from '~/modules/clipboard/infrastructure/clipboardPersistence'
import { type Item, itemSchema } from '~/modules/diet/item/schema/itemSchema'
import { showError } from '~/modules/toast/application/toastManager'
import { ItemListView } from '~/sections/item/components/ItemListView'
import { openConfirmModal } from '~/shared/modal/helpers/modalHelpers'
import { openContentModal } from '~/shared/modal/helpers/modalHelpers'
import { closeModal } from '~/shared/modal/helpers/modalHelpers'
import { deserializeClipboard } from '~/shared/utils/clipboardUtils'
import { logging } from '~/shared/utils/logging'
import { isItem, isMeal, isRecipe } from '~/shared/utils/typeUtils'

export type ClipboardFilter = (clipboard: string) => boolean

export const clipboardStore = createRoot(() => {
  // Default to RAM-only (no persistence)
  const store = createClipboardStore({
    maxEntries: 20,
    persistence: createNoOpPersistence(),
  })
  // Clean expired entries every hour and refresh signal
  setInterval(
    () => {
      store.cleanExpired()
    },
    60 * 60 * 1000,
  )

  return store
})

/**
 * Hook for reading/writing clipboard via the in-app clipboard store
 */
function useClipboard() {
  const handleRead = async () => {
    try {
      const clipboard = clipboardStore.read()
      const clipboardText = JSON.stringify(clipboard?.payload)

      return clipboardText
    } catch (err) {
      showError(`Failed to read using clipboard store: ${JSON.stringify(err)}`)
    }

    return ''
  }

  return {
    read: handleRead,
    clear: () => {
      clipboardStore.clear()
    },
  }
}

/**
 * Hook that provides copy / paste actions for a given schema and handlers
 */
export function useCopyPasteActions<T extends ClipboardPayload>({
  acceptedClipboardSchema,
  getDataToCopy,
  onPaste,
}: {
  acceptedClipboardSchema: z.ZodType<T>
  getDataToCopy: () => T
  onPaste: (data: T) => void
}) {
  const handleCopy = () => {
    clipboardStore.copy(getDataToCopy())
  }

  const emitPasteIfPresent = async (data: T | null) => {
    if (data === null) {
      showError('O conteúdo da área de transferência não pôde ser processado.')
      return
    }
    onPaste(data)
  }

  const readAndParseClipboard = async () => {
    const data = clipboardStore.read()
    const safeParseResult = acceptedClipboardSchema.safeParse(data)
    if (safeParseResult.success) {
      return safeParseResult.data satisfies T
    }
    return null
  }

  // Note: use getPayloadType + openPreviewModal to determine how to show previews

  // Determine payload type by looking at the __type discriminator
  const getPayloadType = (d: T): 'UnifiedItem' | 'Meal' | 'Recipe' | null => {
    if (typeof d !== 'object') return null
    return d.__type
  }

  const openPreviewModal = (payload: T) => {
    const type = getPayloadType(payload)

    // If payload contains items (Meal, Recipe or array of Items), render ItemListView
    if (type === 'UnifiedItem' || type === 'Meal' || type === 'Recipe') {
      let itemsArray: Item[] = []
      if (isRecipe(payload)) {
        itemsArray = payload.items
      } else if (isMeal(payload)) {
        itemsArray = payload.items
      } else if (isItem(payload)) {
        itemsArray = [payload]
      } else {
        payload satisfies never
        logging.error('Unexpected payload type in clipboard preview modal', {
          payload,
        })
        showError(
          'Erro inesperado ao processar o conteúdo da área de transferência.',
        )
        return
      }

      try {
        const validated = itemSchema.array().parse(itemsArray)
        const [itemsSignal] = createSignal(validated)

        const modalId = openContentModal(
          () => (
            <div>
              <div class="mb-4">{`Os seguintes itens serão colados:`}</div>
              <ItemListView items={itemsSignal} handlers={{}} />
            </div>
          ),
          {
            title: 'Colar itens',
            footer: () => (
              <div class="flex gap-2 justify-end">
                <button
                  type="button"
                  class="btn btn-ghost"
                  onClick={() => {
                    closeModal(modalId)
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  class="btn btn-primary"
                  onClick={() => {
                    onPaste(payload)
                    closeModal(modalId)
                  }}
                >
                  Colar
                </button>
              </div>
            ),
            closeOnOutsideClick: false,
            closeOnEscape: true,
            showCloseButton: true,
          },
        )

        return
      } catch (err) {
        // validation failed - fallthrough to default confirm modal
        logging.warn(
          'Preview validation failed, falling back to confirm modal',
          {
            error: err instanceof Error ? err.message : String(err),
          },
        )
      }
    }

    // Fallback: simple confirmation when we cannot preview
    openConfirmModal('Tem certeza que deseja colar os itens?', {
      title: 'Colar itens',
      confirmText: 'Colar',
      cancelText: 'Cancelar',
      onConfirm: () => readAndParseClipboard().then(emitPasteIfPresent),
    })
  }

  const handlePaste = async () => {
    try {
      const parsed = await readAndParseClipboard()

      if (parsed !== null) {
        openPreviewModal(parsed)
        return
      }

      showError('O conteúdo da área de transferência não pôde ser processado.')
      openConfirmModal('Tem certeza que deseja colar os itens?', {
        title: 'Colar itens',
        confirmText: 'Colar',
        cancelText: 'Cancelar',
        onConfirm: () => readAndParseClipboard().then(emitPasteIfPresent),
      })
    } catch (_err) {
      openConfirmModal('Tem certeza que deseja colar os itens?', {
        title: 'Colar itens',
        confirmText: 'Colar',
        cancelText: 'Cancelar',
        onConfirm: () => readAndParseClipboard().then(emitPasteIfPresent),
      })
    }
  }

  return {
    handleCopy,
    handlePaste,
  }
}
