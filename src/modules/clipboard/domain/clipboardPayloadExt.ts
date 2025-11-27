import {
  type ClipboardPayload,
  isItemPayload,
  isMealPayload,
  isRecipePayload,
} from '~/modules/clipboard/domain/clipboardEntry'
import { type Item } from '~/modules/diet/item/schema/itemSchema'
import { regenerateId } from '~/shared/utils/idUtils'

export const ClipboardPayloadExt = {
  extractItems(payload: ClipboardPayload): Item[] {
    if (isItemPayload(payload)) {
      return [regenerateId(payload)]
    } else if (isMealPayload(payload)) {
      return payload.items.map(regenerateId)
    } else if (isRecipePayload(payload)) {
      return payload.items.map(regenerateId)
    }

    payload satisfies never
    return []
  },
}
