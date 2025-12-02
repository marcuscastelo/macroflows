import { type Item } from '~/modules/diet/item/schema/itemSchema'

type ParentWithChildren = { quantity: number; reference: { children: Item[] } }

/**
 * Calculates the sum of all children's quantities
 */
function sumChildrenQuantities(children: Item[]): number {
  return (
    Math.round(children.reduce((sum, c) => sum + c.quantity, 0) * 100) / 100
  )
}

export const ParentItemExt = {
  addChildToParentItem<T extends ParentWithChildren>(
    parentItem: T,
    childItem: Item,
  ): T {
    const newChildren = [...parentItem.reference.children, childItem]
    return {
      ...parentItem,
      quantity: sumChildrenQuantities(newChildren),
      reference: {
        ...parentItem.reference,
        children: newChildren,
      },
    }
  },

  removeChildFromParentItem<T extends ParentWithChildren>(
    parentItem: T,
    childId: number,
  ): T {
    const newChildren = parentItem.reference.children.filter(
      (child) => child.id !== childId,
    )
    return {
      ...parentItem,
      quantity: sumChildrenQuantities(newChildren),
      reference: {
        ...parentItem.reference,
        children: newChildren,
      },
    }
  },

  updateChildInParentItem<T extends ParentWithChildren>(
    parentItem: T,
    childId: number,
    updates: Partial<Pick<Item, 'id' | 'name' | 'quantity'>>,
  ): T {
    const newChildren = parentItem.reference.children.map((child) =>
      child.id === childId ? { ...child, ...updates } : child,
    )
    return {
      ...parentItem,
      quantity: sumChildrenQuantities(newChildren),
      reference: {
        ...parentItem.reference,
        children: newChildren,
      },
    }
  },

  of<T extends ParentWithChildren>(item: T) {
    return {
      value: item,
      addChild: (childItem: Item) =>
        ParentItemExt.addChildToParentItem(item, childItem),
      removeChild: (childId: number) =>
        ParentItemExt.removeChildFromParentItem(item, childId),
      updateChild: (
        childId: number,
        updates: Partial<Pick<Item, 'id' | 'name' | 'quantity'>>,
      ) => ParentItemExt.updateChildInParentItem(item, childId, updates),
    }
  },
}
