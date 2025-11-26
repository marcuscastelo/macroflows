import { describe, expect, it } from 'vitest'

import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { updateChildInItem } from '~/modules/diet/unified-item/domain/childOperations'
import { ParentItemExt } from '~/modules/diet/unified-item/domain/ext/parentItemExt'
import {
  createGroupItem,
  createUnifiedItem,
} from '~/modules/diet/unified-item/schema/unifiedItemSchema'

describe('childOperations', () => {
  const childA = createUnifiedItem({
    id: 11,
    name: 'A',
    quantity: 1,
    reference: {
      type: 'food',
      id: 100,
      macros: createMacroNutrients({ protein: 1, carbs: 1, fat: 1 }),
    },
  })
  const childB = createUnifiedItem({
    id: 12,
    name: 'B',
    quantity: 2,
    reference: {
      type: 'food',
      id: 101,
      macros: createMacroNutrients({ protein: 2, carbs: 2, fat: 2 }),
    },
  })
  const baseGroup = createUnifiedItem({
    id: 10,
    name: 'Group',
    quantity: 1,
    reference: { type: 'group' as const, children: [] },
  })
  it('addChildToItem adds a child', () => {
    const group = createGroupItem({
      ...baseGroup,
      reference: { type: 'group' as const, children: [] },
    })
    const updated = ParentItemExt.addChildToParentItem(group, childA)
    expect(updated.reference.type).toBe('group')
    expect(updated.reference.children.length).toBe(1)
    expect(updated.reference.children[0]?.id).toBe(childA.id)
  })
  it('removeChildFromItem removes a child by id', () => {
    const group = createGroupItem({
      ...baseGroup,
      reference: { type: 'group' as const, children: [childA, childB] },
    })
    const updated = ParentItemExt.removeChildFromParentItem(group, childA.id)
    expect(updated.reference.type).toBe('group')
    expect(updated.reference.children.length).toBe(1)
    expect(updated.reference.children[0]?.id).toBe(childB.id)
  })
  it('updateChildInItem updates a child by id', () => {
    const group = createUnifiedItem({
      ...baseGroup,
      reference: { type: 'group' as const, children: [childA] },
    })
    const updated = updateChildInItem(group, childA.id, { name: 'Updated' })
    expect(updated.reference.type).toBe('group')
    if (updated.reference.type === 'group') {
      expect(updated.reference.children[0]?.name).toBe('Updated')
    }
  })
})
