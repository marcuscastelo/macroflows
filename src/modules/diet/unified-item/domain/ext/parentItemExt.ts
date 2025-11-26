import { type UnifiedItem } from '~/modules/diet/unified-item/schema/unifiedItemSchema'

export const ParentItemExt = {
  addChildToParentItem<T extends { reference: { children: UnifiedItem[] } }>(
    parentItem: T,
    childItem: UnifiedItem,
  ): T {
    return {
      ...parentItem,
      reference: {
        ...parentItem.reference,
        children: [...parentItem.reference.children, childItem],
      },
    }
  },

  of<T extends { reference: { children: UnifiedItem[] } }>(item: T) {
    return {
      value: item,
      addChild: (childItem: UnifiedItem) =>
        ParentItemExt.addChildToParentItem(item, childItem),
    }
  },
}
