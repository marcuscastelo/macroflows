import { ItemExt } from '~/modules/diet/item/domain/ext/itemExt'
import { type GroupItem } from '~/modules/diet/item/schema/itemSchema'

export const GroupItemExt = {
  of(item: GroupItem) {
    const itemExt = ItemExt.of(item)
    return {
      ...itemExt,
      value: item,
    }
  },
}
