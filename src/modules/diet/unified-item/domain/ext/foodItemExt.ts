import { ItemExt } from '~/modules/diet/unified-item/domain/ext/itemExt'
import { type FoodItem } from '~/modules/diet/unified-item/schema/itemSchema'

export const FoodItemExt = {
  of(item: FoodItem) {
    const itemExt = ItemExt.of(item)
    return {
      ...itemExt,
      value: item,
    }
  },
}
