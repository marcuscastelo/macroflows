import {
  type ClipboardPayload,
  isItemPayload,
  isMealPayload,
  isRecipePayload,
} from '~/modules/clipboard/domain/clipboardEntry'
import { type Item } from '~/modules/diet/item/schema/itemSchema'

export const ClipboardPayloadExt = {
  extractItems(payload: ClipboardPayload): Item[] {
    if (isItemPayload(payload)) {
      return [payload]
    } else if (isMealPayload(payload)) {
      return payload.items
    } else if (isRecipePayload(payload)) {
      return payload.items
    }
    payload satisfies never
    return []
  },
}
