import { ItemExt } from '~/modules/diet/unified-item/domain/ext/itemExt'
import { type GroupItem } from '~/modules/diet/unified-item/schema/unifiedItemSchema'

export const GroupItemExt = {
  of(item: GroupItem) {
    const itemExt = ItemExt.of(item)
    return {
      ...itemExt,
    }
  },
}
