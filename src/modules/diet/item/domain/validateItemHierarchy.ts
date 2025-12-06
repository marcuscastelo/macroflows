import { type Item } from '~/modules/diet/item/schema/itemSchema'

/**
 * Validates that the Item hierarchy does not contain circular references.
 * @param item Item
 * @param visited Set of visited item ids
 * @returns boolean
 */
export function validateItemHierarchy(
  item: Item,
  visited: Set<number> = new Set(),
): boolean {
  if (typeof item.id !== 'number') return false
  if (visited.has(item.id)) return false
  visited.add(item.id)
  if (
    (item.reference.type === 'recipe' || item.reference.type === 'group') &&
    Array.isArray(item.reference.children)
  ) {
    for (const child of item.reference.children) {
      if (!validateItemHierarchy(child, visited)) return false
    }
  }
  visited.delete(item.id)
  return true
}
