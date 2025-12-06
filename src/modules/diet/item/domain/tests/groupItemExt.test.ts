import { describe, expect, it } from 'vitest'

import { GroupItemExt } from '~/modules/diet/item/domain/ext/groupItemExt'
import { ItemExt } from '~/modules/diet/item/domain/ext/itemExt'
import type { GroupItem, Item } from '~/modules/diet/item/schema/itemSchema'
import { MacroNutrientsExt } from '~/modules/diet/macro-nutrients/domain/macroExt'
import {
  createMacroNutrients,
  type MacroNutrientsRecord,
} from '~/modules/diet/macro-nutrients/domain/macroNutrients'

const makeFoodItem = (
  id: number,
  name: string,
  quantity: number,
  macros: MacroNutrientsRecord,
): Item => ({
  id,
  name,
  quantity,
  reference: {
    type: 'food',
    id,
    macros: createMacroNutrients(macros),
  },
  __type: 'UnifiedItem' as const,
})

const makeGroupItem = (
  id: number,
  name: string,
  quantity: number,
  children: Item[] = [],
): GroupItem => ({
  id,
  name,
  quantity,
  reference: {
    type: 'group',
    children,
  },
  __type: 'UnifiedItem' as const,
})

describe('GroupItemExt', () => {
  it('of() returns the item extension and ItemExt macros works for group', () => {
    const child = makeFoodItem(1, 'Flour', 100, {
      proteinInMg: 10000,
      carbsInMg: 70000,
      fatInMg: 1000,
    })
    const group = makeGroupItem(10, 'Mix', 200, [child])

    const ext = GroupItemExt.of(group)

    // ext should expose same helpers as ItemExt.of
    expect(ext.quantity()).toBe(group.quantity)
    expect(ext.isGroupItem()).toBe(true)

    // ItemExt.macros should sum children and scale to group quantity
    const macros = ItemExt.macros(group)
    const childMacros = ItemExt.macros(child)

    const macrosExt = MacroNutrientsExt.of(macros)
    const childExt = MacroNutrientsExt.of(childMacros)

    expect(macrosExt.proteinInGrams()).toBeCloseTo(
      (group.quantity / child.quantity) * childExt.proteinInGrams(),
    )
  })
})
