import { isFoodItem, type Item } from '~/modules/diet/item/schema/itemSchema'
import { Macros } from '~/modules/diet/macro-nutrients/domain/macrosExt'

function equals(
  originalItems: readonly Item[],
  currentItems: readonly Item[],
): boolean {
  // If lengths are different, items were added/removed
  if (originalItems.length !== currentItems.length) {
    return false
  }

  // Compare each item by sorting both arrays by ID first to handle reordering
  const sortById = (items: readonly Item[]) =>
    [...items].sort((a, b) => a.id - b.id)

  const sortedOriginal = sortById(originalItems)
  const sortedCurrent = sortById(currentItems)

  for (let i = 0; i < sortedOriginal.length; i++) {
    const original = sortedOriginal[i]!
    const current = sortedCurrent[i]!

    // Compare essential properties that indicate manual editing
    if (
      original.id !== current.id ||
      original.name !== current.name ||
      Math.abs(original.quantity - current.quantity) > 0.0001 ||
      original.reference.type !== current.reference.type
    ) {
      alert(
        `Basic properties differ: original ${JSON.stringify(original)}, current ${JSON.stringify(current)}`,
      )
      return false
    }

    // For food items, compare macros
    if (isFoodItem(original) && isFoodItem(current)) {
      const originalMacros = original.reference.macros
      const currentMacros = current.reference.macros

      if (!Macros.approxEqual(originalMacros, currentMacros)) {
        alert(
          `Macros differ: original ${JSON.stringify(originalMacros)}, current ${JSON.stringify(currentMacros)}`,
        )
        return false
      }
      continue
    } else if (!isFoodItem(original) && !isFoodItem(current)) {
      if (!equals(original.reference.children, current.reference.children)) {
        return false
      }
      continue
    }
    throw new Error('Mismatched item types during comparison')
  }

  return true
}

// Normalize quantities so they sum to 1, preserving relative proportions
function normalizedQuantitiesShallow(items: readonly Item[]): Item[] {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
  if (totalQuantity === 0) {
    return items.map((item) => ({ ...item, quantity: 1 / items.length }))
  }

  return items.map((item) => ({
    ...item,
    quantity: item.quantity / totalQuantity,
  }))
}

export const Items = {
  equals: (originalItems: readonly Item[], currentItems: readonly Item[]) =>
    equals(originalItems, currentItems),
  normalizedQuantitiesShallow: (items: readonly Item[]) =>
    normalizedQuantitiesShallow(items),
}
