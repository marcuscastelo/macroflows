import { scaleRecipeByPreparedQuantity } from '~/modules/diet/recipe/domain/recipeOperations'
import { templateToUnifiedItem } from '~/modules/diet/template/application/templateToItem'
import {
  isTemplateRecipe,
  type Template,
} from '~/modules/diet/template/domain/template'
import {
  createItem,
  isFoodItem,
  isRecipeItem,
  type Item,
} from '~/modules/diet/unified-item/schema/itemSchema'
import { generateId } from '~/shared/utils/idUtils'

/**
 * Creates a UnifiedItem from a Template and TemplateItem.
 * This is the new unified approach that directly creates UnifiedItems.
 *
 * @param template - The Template (food or recipe)
 * @param protoItem - The TemplateItem containing user's desired quantity
 * @returns Object with unifiedItem, operation, templateType
 */
export function createUnifiedItemFromTemplate(
  template: Template,
  protoItem: Item,
): Item {
  if (isFoodItem(protoItem)) {
    return templateToUnifiedItem(template, protoItem.quantity)
  }

  if (isTemplateRecipe(template) && isRecipeItem(protoItem)) {
    // Scale the recipe items based on the user's desired quantity
    const { scaledItems } = scaleRecipeByPreparedQuantity(
      template,
      protoItem.quantity,
    )

    // Create a UnifiedItem with recipe reference containing scaled items
    return createItem({
      id: generateId(),
      name: protoItem.name,
      quantity: protoItem.quantity,
      reference: {
        type: 'recipe',
        id: template.id,
        children: scaledItems,
      },
    })
  }

  throw new Error('Template is not a Recipe or item type mismatch')
}
