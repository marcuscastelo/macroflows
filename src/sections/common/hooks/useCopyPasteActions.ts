import { type z } from 'zod/v4'

import {
  createClipboardSchemaFilter,
  useClipboard,
} from '~/sections/common/hooks/useClipboard'
import { openConfirmModal } from '~/shared/modal/helpers/modalHelpers'
import { deserializeClipboard } from '~/shared/utils/clipboardUtils'

/**
 * Shared clipboard copy/paste logic for meal/recipe editors.
 * @param options
 *   - acceptedClipboardSchema: zod schema for validation
 *   - getDataToCopy: function to get the data to copy
 *   - onPaste: function to handle parsed clipboard data
 */
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

  const handlePaste = () => {
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
