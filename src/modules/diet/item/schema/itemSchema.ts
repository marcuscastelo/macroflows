import { z } from 'zod/v4'

import {
  type MacroNutrients,
  macroNutrientsSchema,
} from '~/modules/diet/macro-nutrients/domain/macroNutrients'

export const itemSchema: z.ZodType<Item> = z.lazy(() =>
  z.union([
    // Food items have macros in their reference
    z.object({
      id: z.number(),
      name: z.string(),
      quantity: z.number(),
      reference: z.object({
        type: z.literal('food'),
        id: z.number(),
        macros: macroNutrientsSchema,
      }),
      __type: z.literal('UnifiedItem'),
    }),
    // Recipe items don't have macros (inferred from children)
    z.object({
      id: z.number(),
      name: z.string(),
      quantity: z.number(),
      reference: z.object({
        type: z.literal('recipe'),
        id: z.number(),
        children: z.array(itemSchema),
      }),
      __type: z.literal('UnifiedItem'),
    }),
    // Group items don't have macros (inferred from children)
    z.object({
      id: z.number(),
      name: z.string(),
      quantity: z.number(),
      reference: z.object({
        type: z.literal('group'),
        children: z.array(itemSchema),
      }),
      __type: z.literal('UnifiedItem'),
    }),
  ]),
)

type ItemBase = {
  id: number
  name: string
  quantity: number
  __type: 'UnifiedItem'
}

type FoodReference = { type: 'food'; id: number; macros: MacroNutrients }
type RecipeReference = { type: 'recipe'; id: number; children: Item[] }
type GroupReference = { type: 'group'; children: Item[] }

export type FoodItem = ItemBase & { reference: FoodReference }
export type RecipeItem = ItemBase & { reference: RecipeReference }
export type GroupItem = ItemBase & { reference: GroupReference }
export type ParentItem = RecipeItem | GroupItem

export type Item = FoodItem | RecipeItem | GroupItem

export const isFoodItem = (item: Item): item is FoodItem =>
  item.reference.type === 'food'

export const isRecipeItem = (item: Item): item is RecipeItem =>
  item.reference.type === 'recipe'

export const isGroupItem = (item: Item): item is GroupItem =>
  item.reference.type === 'group'

export const isParentItem = (item: Item): item is RecipeItem | GroupItem =>
  isRecipeItem(item) || isGroupItem(item)

export const asFoodItem = (item: Item): FoodItem | undefined =>
  isFoodItem(item) ? item : undefined
export const asRecipeItem = (item: Item): RecipeItem | undefined =>
  isRecipeItem(item) ? item : undefined
export const asGroupItem = (item: Item): GroupItem | undefined =>
  isGroupItem(item) ? item : undefined
export const asParentItem = (item: Item): RecipeItem | GroupItem | undefined =>
  isRecipeItem(item) || isGroupItem(item) ? item : undefined

function createBaseItem({
  id,
  name,
  quantity,
}: Omit<Item, 'reference' | '__type'>): Omit<Item, 'reference'> {
  return {
    id,
    name,
    quantity: Math.round(quantity * 100) / 100, // Round to 2 decimal places
    __type: 'UnifiedItem',
  }
}

export function createFoodItem({
  id,
  name,
  quantity,
  reference,
}: Omit<FoodItem, '__type'>): FoodItem {
  const baseItem = createBaseItem({ id, name, quantity })

  return {
    ...baseItem,
    reference: {
      type: 'food',
      id: reference.id,
      macros: reference.macros,
    } satisfies FoodReference,
  }
}

export function createRecipeItem({
  id,
  name,
  quantity,
  reference,
}: Omit<RecipeItem, '__type'>): RecipeItem {
  const baseItem = createBaseItem({ id, name, quantity })

  return {
    ...baseItem,
    reference: {
      type: 'recipe',
      id: reference.id,
      children: reference.children.map((child) => {
        return createItem(child)
      }),
    } satisfies RecipeReference,
  }
}

export function createGroupItem({
  id,
  name,
  quantity,
  reference,
}: Omit<GroupItem, '__type'>): GroupItem {
  const baseItem = createBaseItem({ id, name, quantity })

  return {
    ...baseItem,
    reference: {
      type: 'group',
      children: reference.children.map((child) => {
        return createItem(child)
      }),
    } satisfies GroupReference,
  }
}

export function createItem({
  id,
  name,
  quantity,
  reference,
}: Omit<Item, '__type'>): Item {
  switch (reference.type) {
    case 'food':
      return createFoodItem({ id, name, quantity, reference })
    case 'recipe':
      return createRecipeItem({ id, name, quantity, reference })
    case 'group':
      return createGroupItem({ id, name, quantity, reference })
    default:
      reference satisfies never
      throw new Error(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/consistent-type-assertions
        `Unknown reference type: ${(reference as Record<string, unknown>).type}`,
      )
  }
}
