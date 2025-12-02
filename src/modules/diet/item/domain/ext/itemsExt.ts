import { type Item } from '~/modules/diet/item/schema/itemSchema'

/**
 * Tolerance for comparing normalized proportions (0.01% difference allowed).
 * This accounts for floating-point precision errors that occur when:
 * - Quantities are rounded to 2 decimal places during scaling
 * - Proportions are calculated from rounded quantities
 */
const PROPORTION_TOLERANCE = 0.0001

/**
 * Checks if two numbers are approximately equal within a tolerance.
 */
function approxEqual(a: number, b: number, tolerance: number): boolean {
  return Math.abs(a - b) <= tolerance
}

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

/**
 * Compares two sets of items by their normalized proportions.
 * Uses tolerance-based comparison for quantities to handle floating-point
 * precision errors that occur during quantity scaling and rounding.
 *
 * This is specifically designed for checking if recipe items are "in sync"
 * with their source recipe - items are considered in sync if their relative
 * proportions match, even if absolute quantities differ due to scaling.
 *
 * @param originalItems - The reference items (e.g., from recipe definition)
 * @param currentItems - The items to compare (e.g., from recipe item's children)
 * @returns true if all items match by proportion within tolerance
 */
function equalsByProportion(
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

    // Compare essential properties - use tolerance for quantity (normalized proportion)
    if (
      original.id !== current.id ||
      original.name !== current.name ||
      !approxEqual(original.quantity, current.quantity, PROPORTION_TOLERANCE) ||
      original.reference.type !== current.reference.type
    ) {
      return false
    }

    // For food items, compare macros with tolerance
    if (
      original.reference.type === 'food' &&
      current.reference.type === 'food'
    ) {
      const originalMacros = original.reference.macros
      const currentMacros = current.reference.macros

      if (
        !approxEqual(
          originalMacros.protein,
          currentMacros.protein,
          PROPORTION_TOLERANCE,
        ) ||
        !approxEqual(
          originalMacros.carbs,
          currentMacros.carbs,
          PROPORTION_TOLERANCE,
        ) ||
        !approxEqual(
          originalMacros.fat,
          currentMacros.fat,
          PROPORTION_TOLERANCE,
        )
      ) {
        return false
      }
    }

    // For recipe and group items, recursively compare children by proportion
    if (
      (original.reference.type === 'recipe' &&
        current.reference.type === 'recipe') ||
      (original.reference.type === 'group' &&
        current.reference.type === 'group')
    ) {
      if (
        !equalsByProportion(
          original.reference.children,
          current.reference.children,
        )
      ) {
        return false
      }
    }
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
  equals,
  equalsByProportion,
  normalizedQuantitiesShallow,
}
