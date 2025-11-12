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

  const handlePaste = () => {
    const processClipboardText = async (
      clipboardText: string,
      clearWhenFromApi = true,
    ) => {
      console.debug('Processing clipboard text:', clipboardText)
      const data = deserializeClipboard(clipboardText, acceptedClipboardSchema)
      if (data === null) {
        throw new Error('Invalid clipboard data: ' + clipboardText)
      }
      onPaste(data)
      if (clearWhenFromApi) clearClipboard()
    }

    openConfirmModal('Tem certeza que deseja colar os itens?', {
      title: 'Colar itens',
      confirmText: 'Colar',
      cancelText: 'Cancelar',
      onConfirm: () => readFromClipboard().then(processClipboardText),
    })
  }

  return {
    writeToClipboard,
    clearClipboard,
    handleCopy,
    handlePaste,
  }
}
