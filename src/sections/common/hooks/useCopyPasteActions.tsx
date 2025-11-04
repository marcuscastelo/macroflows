import { type z } from 'zod/v4'

import {
  createClipboardSchemaFilter,
  useClipboard,
} from '~/sections/common/hooks/useClipboard'
import {
  closeModal,
  openConfirmModal,
  openContentModal,
} from '~/shared/modal/helpers/modalHelpers'
import { deserializeClipboard } from '~/shared/utils/clipboardUtils'

export function useCopyPasteActions<T>({
  acceptedClipboardSchema,
  getDataToCopy,
  onPaste,
}: {
  acceptedClipboardSchema: z.ZodType<T>
  getDataToCopy: () => T
  onPaste: (data: T) => void
}) {
  const isClipboardValid = createClipboardSchemaFilter(acceptedClipboardSchema)
  const {
    read: readFromClipboard,
    write: writeToClipboard,
    clear: clearClipboard,
  } = useClipboard({
    filter: isClipboardValid,
  })

  const handleCopy = () => {
    writeToClipboard(JSON.stringify(getDataToCopy()))
  }

  const handlePasteAfterConfirm = async () => {
    const clipboardText = await readFromClipboard()
    const data = deserializeClipboard(clipboardText, acceptedClipboardSchema)
    if (data === null) {
      throw new Error('Invalid clipboard data: ' + clipboardText)
    }
    onPaste(data)
    clearClipboard()
  }

  type PasteEventLike =
    | ClipboardEvent
    | {
        clipboardData?: DataTransfer | null
        preventDefault?: () => void
      }

  const handlePaste = (pasteEvent?: PasteEventLike) => {
    const processClipboardText = async (
      clipboardText: string,
      clearWhenFromApi = true,
    ) => {
      const data = deserializeClipboard(clipboardText, acceptedClipboardSchema)
      if (data === null) {
        throw new Error('Invalid clipboard data: ' + clipboardText)
      }
      onPaste(data)
      if (clearWhenFromApi) clearClipboard()
    }

    let eventClipboardText: string | null = null
    if (
      pasteEvent &&
      'clipboardData' in pasteEvent &&
      pasteEvent.clipboardData
    ) {
      try {
        eventClipboardText = pasteEvent.clipboardData.getData('text') || null
      } catch {
        eventClipboardText = null
      }
    }

    if (eventClipboardText !== null) {
      try {
        pasteEvent?.preventDefault?.()
      } catch {
        // ignore if cannot prevent
      }

      openConfirmModal('Tem certeza que deseja colar os itens?', {
        title: 'Colar itens',
        confirmText: 'Colar',
        cancelText: 'Cancelar',
        onConfirm: () => processClipboardText(eventClipboardText, false),
      })
      return
    }

    const modalId = openContentModal((mid) => (
      <div class="p-4">
        <p class="mb-2">
          Cole os itens agora (pressione <strong>Ctrl/Cmd+V</strong>)
        </p>
        <div
          id={`paste-target-${mid}`}
          tabindex={0}
          class="w-full h-24 rounded bg-gray-800 border border-gray-700 p-2 overflow-auto"
          onPaste={(e: ClipboardEvent) => {
            try {
              const text = e.clipboardData?.getData('text') ?? ''
              void closeModal(mid)
              void processClipboardText(text, false)
            } catch {
              // ignore and keep modal open
            }
          }}
        >
          <div class="text-sm text-gray-400">
            Foco aqui — pressione Ctrl/Cmd+V
          </div>
        </div>

        <div class="mt-4 flex gap-2 justify-end">
          <button
            class="btn btn-ghost"
            onClick={() => {
              void closeModal(mid)
              openConfirmModal('Tem certeza que deseja colar os itens?', {
                title: 'Colar itens',
                confirmText: 'Colar',
                cancelText: 'Cancelar',
                onConfirm: handlePasteAfterConfirm,
              })
            }}
          >
            Colar do clipboard (fallback)
          </button>
          <button
            class="btn btn-primary"
            onClick={() => {
              void closeModal(mid)
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    ))

    // Focus the paste target element so the user can immediately press Ctrl/Cmd+V
    setTimeout(() => {
      const el = document.getElementById(`paste-target-${modalId}`)
      el?.focus()
    }, 0)
  }

  const hasValidPastableOnClipboard = async () =>
    isClipboardValid(await readFromClipboard())

  return {
    writeToClipboard,
    clearClipboard,
    handleCopy,
    handlePaste,
    hasValidPastableOnClipboard,
  }
}
