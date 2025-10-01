import { z } from 'zod/v4'

import {
  type MacroNutrients,
  macroNutrientsSchema,
} from '~/modules/diet/macro-nutrients/domain/macroNutrients'

export const unifiedItemSchema: z.ZodType<UnifiedItem> = z.lazy(() =>
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
        children: z.array(unifiedItemSchema),
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
        children: z.array(unifiedItemSchema),
      }),
      __type: z.literal('UnifiedItem'),
    }),
  ]),
)

type UnifiedItemBase = {
  id: number
  name: string
  quantity: number
  __type: 'UnifiedItem'
}

type FoodReference = { type: 'food'; id: number; macros: MacroNutrients }
type RecipeReference = { type: 'recipe'; id: number; children: UnifiedItem[] }
type GroupReference = { type: 'group'; children: UnifiedItem[] }

export type FoodItem = UnifiedItemBase & { reference: FoodReference }
export type RecipeItem = UnifiedItemBase & { reference: RecipeReference }
export type GroupItem = UnifiedItemBase & { reference: GroupReference }

export type UnifiedItem = FoodItem | RecipeItem | GroupItem

export const isFoodItem = (item: UnifiedItem): item is FoodItem =>
  item.reference.type === 'food'

export const isRecipeItem = (item: UnifiedItem): item is RecipeItem =>
  item.reference.type === 'recipe'

export const isGroupItem = (item: UnifiedItem): item is GroupItem =>
  item.reference.type === 'group'

export const asFoodItem = (item: UnifiedItem): FoodItem | undefined =>
  isFoodItem(item) ? item : undefined
export const asRecipeItem = (item: UnifiedItem): RecipeItem | undefined =>
  isRecipeItem(item) ? item : undefined
export const asGroupItem = (item: UnifiedItem): GroupItem | undefined =>
  isGroupItem(item) ? item : undefined

export function createUnifiedItem({
  id,
  name,
  quantity,
  reference,
}: Omit<UnifiedItem, '__type'>): UnifiedItem {
  const itemWithoutReference: Omit<UnifiedItem, 'reference'> = {
    id,
    name,
    quantity: Math.round(quantity * 100) / 100, // Round to 2 decimal places
    __type: 'UnifiedItem',
  }

  if (reference.type === 'food') {
    return {
      ...itemWithoutReference,
      reference: {
        type: 'food',
        id: reference.id,
        macros: reference.macros,
      } satisfies FoodReference,
    }
  }

  if (reference.type === 'recipe') {
    return {
      ...itemWithoutReference,
      reference: {
        type: 'recipe',
        id: reference.id,
        children: reference.children.map((child) => {
          return createUnifiedItem(child)
        }),
      },
    }
  }

  reference satisfies GroupReference

  // TypeScript has already narrowed this to 'group' type
  return {
    ...itemWithoutReference,
    reference: {
      type: 'group',
      children: reference.children.map((child) => {
        return createUnifiedItem(child)
      }),
    },
  }
}
