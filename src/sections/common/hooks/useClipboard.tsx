import { type z } from 'zod/v4'

import { useClipboardStore } from '~/modules/clipboard/application/useClipboardStore'
import { clipboardPayloadSchema } from '~/modules/clipboard/domain/clipboardEntry'
import {
  showError,
  showSuccess,
} from '~/modules/toast/application/toastManager'
import { jsonParseWithStack } from '~/shared/utils/jsonParseWithStack'
import { parseWithStack } from '~/shared/utils/parseWithStack'

export type ClipboardFilter = (clipboard: string) => boolean

export function useClipboard(props?: {
  filter?: ClipboardFilter
  periodicRead?: boolean
}) {
  const { copy, read, clear: clearStore } = useClipboardStore()
  const filter = () => props?.filter

  const handleWrite = (text: string, onError?: (error: unknown) => void) => {
    try {
      // Treat empty string as a clear request for the clipboard store
      if (text === '') {
        clearStore()
        return
      }

      // If the incoming text is JSON, parse it first so Zod receives an object
      let parsed: unknown = text
      try {
        parsed = jsonParseWithStack(text)
      } catch {
        // If it's not valid JSON, leave as-is and let Zod validation fail
      }

      console.debug('Parsed clipboard payload:', parsed)
      const payload = parseWithStack(clipboardPayloadSchema, parsed)
      copy(payload)

      if (text.length > 0) {
        showSuccess(`Copiado com sucesso`)
      }
    } catch (err) {
      showError(
        `Failed to parse or copy using clipboard store: ${JSON.stringify(err)}`,
      )
      onError?.(err)
    }
  }

  const handleRead = async () => {
    try {
      const clipboard = read()
      const clipboardText = JSON.stringify(clipboard?.payload)

      return clipboardText
    } catch (err) {
      showError(`Failed to read using clipboard store: ${JSON.stringify(err)}`)
    }

    return ''
  }

  return {
    write: handleWrite,
    read: handleRead,
    clear: () => {
      handleWrite('')
    },
  }
}

export function createClipboardSchemaFilter(
  acceptedClipboardSchema: z.ZodType,
) {
  return (clipboard: string) => {
    if (clipboard === '') return false
    let parsedClipboard: unknown
    try {
      parsedClipboard = jsonParseWithStack(clipboard)
    } catch {
      // Error parsing JSON. Probably clipboard is some random text from the user
      return false
    }

    return acceptedClipboardSchema.safeParse(parsedClipboard).success
  }
}
