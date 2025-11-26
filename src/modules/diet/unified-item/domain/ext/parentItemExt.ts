import { type Item } from '~/modules/diet/unified-item/schema/itemSchema'

export const ParentItemExt = {
  addChildToParentItem<T extends { reference: { children: Item[] } }>(
    parentItem: T,
    childItem: Item,
  ): T {
    return {
      ...parentItem,
      reference: {
        ...parentItem.reference,
        children: [...parentItem.reference.children, childItem],
      },
    }
  },

  removeChildFromParentItem<T extends { reference: { children: Item[] } }>(
    parentItem: T,
    childId: number,
  ): T {
    return {
      ...parentItem,
      reference: {
        ...parentItem.reference,
        children: parentItem.reference.children.filter(
          (child) => child.id !== childId,
        ),
      },
    }
  },

  updateChildInParentItem<T extends { reference: { children: Item[] } }>(
    parentItem: T,
    childId: number,
    updates: Partial<Pick<Item, 'id' | 'name' | 'quantity'>>,
  ): T {
    return {
      ...parentItem,
      reference: {
        ...parentItem.reference,
        children: parentItem.reference.children.map((child) =>
          child.id === childId ? { ...child, ...updates } : child,
        ),
      },
    }
  },

  of<T extends { reference: { children: Item[] } }>(item: T) {
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
