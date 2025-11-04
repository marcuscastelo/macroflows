import { type z } from 'zod/v4'

import {
  createClipboardSchemaFilter,
  useClipboard,
} from '~/sections/common/hooks/useClipboard'
import { openConfirmModal } from '~/shared/modal/helpers/modalHelpers'
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

    // No event-provided clipboard data: use the previous flow (confirmation -> clipboard API)
    openConfirmModal('Tem certeza que deseja colar os itens?', {
      title: 'Colar itens',
      confirmText: 'Colar',
      cancelText: 'Cancelar',
      onConfirm: handlePasteAfterConfirm,
    })
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
