import { describe, expect, it } from 'vitest'

import { ParentItemExt } from '~/modules/diet/item/domain/ext/parentItemExt'
import {
  createGroupItem,
  createItem,
} from '~/modules/diet/item/schema/itemSchema'
import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'

describe('parentItemExt', () => {
  const childA = createItem({
    id: 11,
    name: 'A',
    quantity: 1,
    reference: {
      type: 'food',
      id: 100,
      macros: createMacroNutrients({ protein: 1, carbs: 1, fat: 1 }),
    },
  })
  const childB = createItem({
    id: 12,
    name: 'B',
    quantity: 2,
    reference: {
      type: 'food',
      id: 101,
      macros: createMacroNutrients({ protein: 2, carbs: 2, fat: 2 }),
    },
  })
  const baseGroup = createItem({
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

  it('addChildToItem updates parent quantity to sum of children', () => {
    const group = createGroupItem({
      ...baseGroup,
      quantity: 0,
      reference: { type: 'group' as const, children: [] },
    })
    const updated = ParentItemExt.addChildToParentItem(group, childA)
    expect(updated.quantity).toBe(childA.quantity)

    const updated2 = ParentItemExt.addChildToParentItem(updated, childB)
    expect(updated2.quantity).toBe(childA.quantity + childB.quantity)
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

  it('removeChildFromItem updates parent quantity to sum of remaining children', () => {
    const group = createGroupItem({
      ...baseGroup,
      quantity: childA.quantity + childB.quantity,
      reference: { type: 'group' as const, children: [childA, childB] },
    })
    const updated = ParentItemExt.removeChildFromParentItem(group, childA.id)
    expect(updated.quantity).toBe(childB.quantity)
  })

  it('updateChildInItem updates a child by id', () => {
    const group = createGroupItem({
      ...baseGroup,
      reference: { type: 'group' as const, children: [childA] },
    })
    const updated = ParentItemExt.updateChildInParentItem(group, childA.id, {
      name: 'Updated',
    })
    expect(updated.reference.type).toBe('group')
    expect(updated.reference.children[0]?.name).toBe('Updated')
  })

  it('updateChildInItem updates parent quantity when child quantity changes', () => {
    const group = createGroupItem({
      ...baseGroup,
      quantity: childA.quantity + childB.quantity, // Initial: 1 + 2 = 3
      reference: { type: 'group' as const, children: [childA, childB] },
    })

    // Update childB quantity from 2 to 5
    const updated = ParentItemExt.updateChildInParentItem(group, childB.id, {
      quantity: 5,
    })

    // Parent quantity should now be 1 + 5 = 6
    expect(updated.quantity).toBe(6)
    expect(updated.reference.children[1]?.quantity).toBe(5)
  })

  it('updateChildInItem preserves explicit child quantity edits (ad-hoc edit bug fix)', () => {
    // This test ensures the fix for the bug where editing a child's quantity
    // in group view was being rebalanced instead of preserved.
    // Example from issue: sandwich with 50g bread + 30g cheese = 80g total
    const bread = createItem({
      id: 1,
      name: 'Bread',
      quantity: 50,
      reference: {
        type: 'food',
        id: 100,
        macros: createMacroNutrients({ protein: 5, carbs: 25, fat: 1 }),
      },
    })
    const cheese = createItem({
      id: 2,
      name: 'Cheese',
      quantity: 30,
      reference: {
        type: 'food',
        id: 101,
        macros: createMacroNutrients({ protein: 7, carbs: 1, fat: 9 }),
      },
    })

    const sandwich = createGroupItem({
      id: 10,
      name: 'Sandwich',
      quantity: 80, // 50 + 30
      reference: { type: 'group' as const, children: [bread, cheese] },
    })

    // User edits cheese from 30g to 40g
    const updated = ParentItemExt.updateChildInParentItem(sandwich, cheese.id, {
      quantity: 40,
    })

    // Cheese should be 40g (user's explicit edit preserved)
    expect(updated.reference.children[1]?.quantity).toBe(40)
    // Bread should still be 50g (unchanged)
    expect(updated.reference.children[0]?.quantity).toBe(50)
    // Total should be 90g (50 + 40)
    expect(updated.quantity).toBe(90)
  })
})
