import { type z } from 'zod/v4'

import {
  showError,
  showSuccess,
} from '~/modules/toast/application/toastManager'
import { jsonParseWithStack } from '~/shared/utils/jsonParseWithStack'

// Utility to check if an error is a NotAllowedError DOMException
function isClipboardNotAllowedError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'NotAllowedError'
}

export type ClipboardFilter = (clipboard: string) => boolean

export function useClipboard(props?: {
  filter?: ClipboardFilter
  periodicRead?: boolean
}) {
  const filter = () => props?.filter

  const handleWrite = (text: string, onError?: (error: unknown) => void) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (window.navigator.clipboard === undefined) {
      showError(`Clipboard API not supported`)
      return
    }
    window.navigator.clipboard
      .writeText(text)
      .then(() => {
        if (text.length > 0) {
          showSuccess(`Copiado com sucesso`)
        }
      })
      .catch((err) => {
        if (isClipboardNotAllowedError(err)) {
          // Ignore NotAllowedError (likely DOM not focused)
          return
        }
        if (onError !== undefined) onError(err)
      })
  }

  const handleRead = async () => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (window.navigator.clipboard === undefined) {
      return ''
    }
    const clipboardText = await window.navigator.clipboard
      .readText()
      .catch(() => '')

    if (filter()?.(clipboardText) ?? true) {
      return clipboardText
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
