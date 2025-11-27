import { createRoot, createSignal } from 'solid-js'
import { type z } from 'zod/v4'

import { createClipboardStore } from '~/modules/clipboard/application/store/clipboardStore'
import { type ClipboardPayload } from '~/modules/clipboard/domain/clipboardEntry'
import { createNoOpPersistence } from '~/modules/clipboard/infrastructure/clipboardPersistence'
import { type Item, itemSchema } from '~/modules/diet/item/schema/itemSchema'
import { showError } from '~/modules/toast/application/toastManager'
import { ItemListView } from '~/sections/item/components/ItemListView'
import { openContentModal } from '~/shared/modal/helpers/modalHelpers'
import { closeModal } from '~/shared/modal/helpers/modalHelpers'
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

const openPreviewModal = <T extends ClipboardPayload>(
  payload: T,
  onPaste: (data: T) => void,
) => {
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
    logging.warn('Preview validation failed, falling back to confirm modal', {
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

const readAndParseClipboard = async <T extends ClipboardPayload>(
  acceptedClipboardSchema: z.ZodType<T>,
): Promise<T | null> => {
  const data = clipboardStore.read()
  if (data === null) {
    logging.debug('No clipboard data present')
    return null
  }

  const safeParseResult = acceptedClipboardSchema.safeParse(data.payload)
  if (!safeParseResult.success) {
    logging.warn('Clipboard data did not match accepted schema', {
      errors: safeParseResult.error,
    })
    showError('O conteúdo da área de transferência não é compatível.')
    return null
  }

  return safeParseResult.data satisfies T
}

/**
 * Hook that provides copy / paste actions for a given schema and handlers
 */
export function useCopyPasteActions<T extends ClipboardPayload>({
  acceptedClipboardSchema,
  onPaste,
}: {
  acceptedClipboardSchema: z.ZodType<T>
  onPaste: (data: T) => void
}) {
  const paste = async () => {
    const parsed = await readAndParseClipboard(acceptedClipboardSchema)
    if (parsed === null) {
      showError('A área de transferência está vazia ou o conteúdo é inválido.')
      return
    }

    openPreviewModal(parsed, onPaste)
  }

  return {
    paste,
  }
}
