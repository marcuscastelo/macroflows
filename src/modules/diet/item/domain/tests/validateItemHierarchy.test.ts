import { describe, expect, it } from 'vitest'

import { validateItemHierarchy } from '~/modules/diet/item/domain/validateItemHierarchy'
import { createItem } from '~/modules/diet/item/schema/itemSchema'
import { type Item } from '~/modules/diet/item/schema/itemSchema'
import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'

describe('validateItemHierarchy', () => {
  const unifiedFood: Item = createItem({
    id: 1,
    name: 'Chicken',
    quantity: 100,
    reference: {
      type: 'food',
      id: 10,
      macros: createMacroNutrients({
        proteinInGrams: 20,
        carbsInGrams: 0,
        fatInGrams: 2,
      }),
    },
  })
  const unifiedGroup: Item = createItem({
    id: 2,
    name: 'Lunch',
    quantity: 100,
    reference: { type: 'group', children: [unifiedFood] },
  })
  it('validates non-circular hierarchy', () => {
    expect(validateItemHierarchy(unifiedGroup)).toBe(true)
  })
  it('detects circular references', () => {
    const circular: Item = {
      ...unifiedGroup,
      reference: { type: 'group', children: [unifiedGroup] },
    }
    expect(validateItemHierarchy(circular)).toBe(false)
  })
})
