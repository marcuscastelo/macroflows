import { ItemExt } from '~/modules/diet/unified-item/domain/ext/itemExt'
import { type RecipeItem } from '~/modules/diet/unified-item/schema/unifiedItemSchema'

export const RecipeItemExt = {
  of(item: RecipeItem) {
    const itemExt = ItemExt.of(item)
    return {
      ...itemExt,
    }
  },
}
