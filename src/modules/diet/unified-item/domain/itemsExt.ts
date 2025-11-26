import { type UnifiedItem } from '~/modules/diet/unified-item/schema/unifiedItemSchema'

function equals(
  originalItems: readonly UnifiedItem[],
  currentItems: readonly UnifiedItem[],
): boolean {
  // If lengths are different, items were added/removed
  if (originalItems.length !== currentItems.length) {
    return false
  }

  // Compare each item by sorting both arrays by ID first to handle reordering
  const sortById = (items: readonly UnifiedItem[]) =>
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
      original.quantity !== current.quantity ||
      original.reference.type !== current.reference.type
    ) {
      return false
    }

    // For food items, compare macros
    if (
      original.reference.type === 'food' &&
      current.reference.type === 'food'
    ) {
      const originalMacros = original.reference.macros
      const currentMacros = current.reference.macros

      if (
        originalMacros.protein !== currentMacros.protein ||
        originalMacros.carbs !== currentMacros.carbs ||
        originalMacros.fat !== currentMacros.fat
      ) {
        return false
      }
    }

    // For recipe and group items, recursively compare children
    if (
      (original.reference.type === 'recipe' &&
        current.reference.type === 'recipe') ||
      (original.reference.type === 'group' &&
        current.reference.type === 'group')
    ) {
      if (!equals(original.reference.children, current.reference.children)) {
        return false
      }
    }
  }

  return true
}

export const Items = {
  equals,
}
