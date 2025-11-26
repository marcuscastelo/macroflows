import {
  isTemplateFood,
  type Template,
} from '~/modules/diet/template/domain/template'
import { type TemplateItem } from '~/modules/diet/template-item/domain/templateItem'
import { createItem } from '~/modules/diet/unified-item/schema/itemSchema'
import { generateId } from '~/shared/utils/idUtils'

export const DEFAULT_QUANTITY = 100

/**
 * Converts a Template to a UnifiedItem directly (unified approach).
 * This is the new preferred method for converting templates.
 *
 * @param template - The Template to convert
 * @param desiredQuantity - The desired quantity in grams (defaults to 100g)
 * @returns The corresponding UnifiedItem
 */
export function templateToUnifiedItem(
  template: Template,
  desiredQuantity: number = DEFAULT_QUANTITY,
): TemplateItem {
  if (isTemplateFood(template)) {
    return createItem({
      id: generateId(),
      name: template.name,
      quantity: desiredQuantity,
      reference: { type: 'food', id: template.id, macros: template.macros },
    })
  }

  // For recipes, we don't store macros directly in UnifiedItems
  // They will be calculated from children
  return createItem({
    id: generateId(),
    name: template.name,
    quantity: desiredQuantity,
    reference: {
      type: 'recipe',
      id: template.id,
      children: template.items,
    },
  })
}
