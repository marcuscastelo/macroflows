import { ItemExt } from '~/modules/diet/item/domain/ext/itemExt'
import { type FoodItem } from '~/modules/diet/item/schema/itemSchema'

export const FoodItemExt = {
  of(item: FoodItem) {
    const itemExt = ItemExt.of(item)
    return {
      ...itemExt,
      value: item,
    }
  },
}
