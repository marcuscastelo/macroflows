import { isFoodItem, type Item } from '~/modules/diet/item/schema/itemSchema'
import {
  DEFAULT_TOLERANCE_MG,
  Macros,
} from '~/modules/diet/macro-nutrients/domain/macrosExt'
import { logging } from '~/shared/utils/logging'

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

  console.log(
    `Comparing \n\t${JSON.stringify(sortedOriginal.map((item) => item.quantity))} to \n\t${JSON.stringify(
      sortedCurrent.map((item) => item.quantity),
    )}`,
  )
  for (let i = 0; i < sortedOriginal.length; i++) {
    const original = sortedOriginal[i]!
    const current = sortedCurrent[i]!

    const quantityMgDifference =
      Math.abs(
        Math.round(original.quantity * 1000) -
          Math.round(current.quantity * 1000),
      ) * 1000

    console.log(
      `Comparing Item ID ${original.name}: quantity difference in mg = ${quantityMgDifference}`,
    )
    if (quantityMgDifference > DEFAULT_TOLERANCE_MG) {
      console.log(
        `  Original quantity: ${original.quantity}, Current quantity: ${current.quantity}`,
      )
    }

    // Compare essential properties that indicate manual editing
    if (
      original.id !== current.id ||
      original.name !== current.name ||
      quantityMgDifference > DEFAULT_TOLERANCE_MG ||
      original.reference.type !== current.reference.type
    ) {
      return false
    }

    // For food items, compare macros
    if (isFoodItem(original) && isFoodItem(current)) {
      const originalMacros = original.reference.macros
      const currentMacros = current.reference.macros

      if (!Macros.approxEqual(originalMacros, currentMacros)) {
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

// Normalize quantities so they sum to 100, preserving relative proportions
function normalizedQuantitiesShallow(items: readonly Item[]): Item[] {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
  if (totalQuantity === 0) {
    let normalizedItems = items.map((item) => ({
      ...item,
      quantity: Math.round(100 / items.length),
    }))
    const sum = normalizedItems.reduce((sum, item) => sum + item.quantity, 0)
    if (sum !== 100) {
      const difference = 100 - sum
      const adjustPerItem = difference / normalizedItems.length
      normalizedItems = normalizedItems.map((item) => ({
        ...item,
        quantity: item.quantity + adjustPerItem,
      }))
    }
    return normalizedItems
  }

  let normalizedItems = items.map((item) => ({
    ...item,
    quantity: Math.round((item.quantity / totalQuantity) * 100),
  }))

  const sum = normalizedItems.reduce((sum, item) => sum + item.quantity, 0)
  if (sum !== 100) {
    const difference = 100 - sum
    const adjustPerItem = difference / normalizedItems.length
    normalizedItems = normalizedItems.map((item) => ({
      ...item,
      quantity: item.quantity + adjustPerItem,
    }))
  }

  const sum2 = normalizedItems.reduce((sum, item) => sum + item.quantity, 0)
  if (sum2 !== 100) {
    logging.warn(
      '[Items.normalizedQuantitiesShallow] Normalization adjustment failed to reach 100%',
      { sum2, normalizedItems, items },
    )
  }

  return normalizedItems
}

export const Items = {
  equals: (originalItems: readonly Item[], currentItems: readonly Item[]) =>
    equals(originalItems, currentItems),
  normalizedQuantitiesShallow: (items: readonly Item[]) =>
    normalizedQuantitiesShallow(items),
}
