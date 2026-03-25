import { z } from 'zod/v4'

import { foodSchema } from '~/modules/diet/food/domain/food'
import { type Item, itemSchema } from '~/modules/diet/item/schema/itemSchema'
import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import {
  type NewRecentFood,
  type RecentFood,
  recentFoodSchema,
} from '~/modules/diet/recent-food/domain/recentFood'
import { recipeSchema } from '~/modules/diet/recipe/domain/recipe'
import { type Template } from '~/modules/diet/template/domain/template'
import { type User } from '~/modules/user/domain/user'
import { type Database, type Json } from '~/shared/supabase/database.types'
import { supabase } from '~/shared/supabase/supabase'
import { parseWithStack } from '~/shared/utils/parseWithStack'
import { removeDiacritics } from '~/shared/utils/removeDiacritics'

const SUPABASE_TABLE_RECENT_FOODS = 'recent_foods'

type RecentFoodDTO = Database['public']['Tables']['recent_foods']['Row']
type UpdateRecentFoodDTO =
  Database['public']['Tables']['recent_foods']['Update']
type InsertRecentFoodDTO =
  Database['public']['Tables']['recent_foods']['Insert']

const enhancedRecentFoodRowSchema = z
  .object({
    recent_food_id: z.number(),
    user_id: z.string(),
    type: z.enum(['food', 'recipe']),
    reference_id: z.number(),
    last_used: z.coerce.date(),
    times_used: z.number(),
    template_id: z.number(),
    template_name: z.string(),
    template_ean: z.string().nullable(),
    template_source: z.unknown(),
    template_macros: z.unknown(),
    template_owner: z.string().nullable(),
    template_items: z.unknown(),
    template_prepared_multiplier: z.number().nullable(),
  })
  .strip()

function macrosToDomain(macrosDTO: Json) {
  if (
    macrosDTO === null ||
    !(typeof macrosDTO === 'object') ||
    !('carbs' in macrosDTO) ||
    !('protein' in macrosDTO) ||
    !('fat' in macrosDTO) ||
    typeof macrosDTO.carbs !== 'number' ||
    typeof macrosDTO.protein !== 'number' ||
    typeof macrosDTO.fat !== 'number'
  ) {
    throw new Error(
      'macrosDTO is missing macros field: ' + JSON.stringify(macrosDTO),
    )
  }

  return createMacroNutrients({
    carbsInMg: macrosDTO.carbs * 1000,
    proteinInMg: macrosDTO.protein * 1000,
    fatInMg: macrosDTO.fat * 1000,
  })
}

function itemToDomain(itemDTO: Json): Item {
  if (
    itemDTO === null ||
    !(typeof itemDTO === 'object') ||
    !('id' in itemDTO) ||
    !('name' in itemDTO) ||
    !('quantity' in itemDTO) ||
    !('reference' in itemDTO) ||
    typeof itemDTO.id !== 'number' ||
    typeof itemDTO.name !== 'string' ||
    typeof itemDTO.quantity !== 'number' ||
    typeof itemDTO.reference !== 'object' ||
    itemDTO.reference === null ||
    Array.isArray(itemDTO.reference) ||
    !('type' in itemDTO.reference)
  ) {
    throw new Error(
      'Item DTO is missing required fields: ' + JSON.stringify(itemDTO),
    )
  }

  const referenceType = itemDTO.reference.type
  if (
    referenceType === 'food' &&
    (!('id' in itemDTO.reference) ||
      typeof itemDTO.reference.id !== 'number' ||
      !('macros' in itemDTO.reference) ||
      typeof itemDTO.reference.macros !== 'object' ||
      itemDTO.reference.macros === null)
  ) {
    throw new Error(
      'Food Item DTO reference is missing required fields: ' +
        JSON.stringify(itemDTO.reference),
    )
  } else if (
    referenceType === 'recipe' &&
    (!('id' in itemDTO.reference) ||
      typeof itemDTO.reference.id !== 'number' ||
      !('children' in itemDTO.reference) ||
      !Array.isArray(itemDTO.reference.children))
  ) {
    throw new Error(
      'Recipe Item DTO reference is missing required fields: ' +
        JSON.stringify(itemDTO.reference),
    )
  } else if (
    referenceType === 'group' &&
    (!('children' in itemDTO.reference) ||
      !Array.isArray(itemDTO.reference.children))
  ) {
    throw new Error(
      'Group Item DTO reference is missing required fields: ' +
        JSON.stringify(itemDTO.reference),
    )
  }

  if (
    referenceType !== 'food' &&
    referenceType !== 'recipe' &&
    referenceType !== 'group'
  ) {
    throw new Error(
      'Item DTO reference has invalid type: ' +
        JSON.stringify(itemDTO.reference),
    )
  }

  if (referenceType === 'food') {
    if (
      itemDTO.reference.macros === null ||
      typeof itemDTO.reference.macros !== 'object'
    ) {
      throw new Error(
        'Food Item DTO reference macros is invalid: ' +
          JSON.stringify(itemDTO.reference.macros),
      )
    }

    return parseWithStack(itemSchema, {
      id: itemDTO.id,
      name: itemDTO.name,
      quantity: itemDTO.quantity,
      reference: {
        type: 'food',
        id: itemDTO.reference.id,
        macros: macrosToDomain(itemDTO.reference.macros),
      },
      __type: 'UnifiedItem',
    })
  }

  if (
    itemDTO.reference.children === null ||
    !Array.isArray(itemDTO.reference.children)
  ) {
    throw new Error(
      'Item DTO reference children is invalid: ' +
        JSON.stringify(itemDTO.reference.children),
    )
  }

  const children: Item[] = itemDTO.reference.children.map((childDTO: Json) =>
    itemToDomain(childDTO),
  )

  if (referenceType === 'recipe') {
    return parseWithStack(itemSchema, {
      id: itemDTO.id,
      name: itemDTO.name,
      quantity: itemDTO.quantity,
      reference: {
        type: 'recipe',
        id: itemDTO.reference.id,
        children,
      },
      __type: 'UnifiedItem' as const,
    })
  }

  return parseWithStack(itemSchema, {
    id: itemDTO.id,
    name: itemDTO.name,
    quantity: itemDTO.quantity,
    reference: {
      type: 'group',
      children,
    },
    __type: 'UnifiedItem' as const,
  })
}

function getRecipeFields(row: z.infer<typeof enhancedRecentFoodRowSchema>) {
  if (row.type !== 'recipe') {
    throw new Error('Expected recipe type but got food')
  }

  const user_id = row.template_owner
  const preparedMultiplier = row.template_prepared_multiplier

  if (user_id === null || preparedMultiplier === null) {
    throw new Error('Recipe fields cannot be null')
  }

  return { user_id, preparedMultiplier }
}

function transformRowToTemplate(row: unknown): Template {
  const validatedRow = parseWithStack(enhancedRecentFoodRowSchema, row)

  if (validatedRow.type === 'food') {
    const macrosDTO = parseWithStack(
      z.object({ carbs: z.number(), protein: z.number(), fat: z.number() }),
      validatedRow.template_macros,
    )

    return parseWithStack(foodSchema, {
      id: validatedRow.template_id,
      name: validatedRow.template_name,
      ean: validatedRow.template_ean,
      source: validatedRow.template_source,
      macros: macrosToDomain(macrosDTO),
      __type: 'Food',
    })
  }

  const { user_id, preparedMultiplier } = getRecipeFields(validatedRow)
  const items = Array.isArray(validatedRow.template_items)
    ? (() => {
        const itemsDTO = parseWithStack(
          z.array(z.any()),
          validatedRow.template_items,
        )
        return itemsDTO.map((item: Json) => itemToDomain(item))
      })()
    : (() => {
        throw new Error(
          'Recent food recipe template items is not an array: ' +
            JSON.stringify(validatedRow.template_items),
        )
      })()

  return parseWithStack(recipeSchema, {
    id: validatedRow.template_id,
    name: validatedRow.template_name,
    user_id,
    items,
    prepared_multiplier: preparedMultiplier,
    __type: 'Recipe',
  })
}

function toUpdateDTO(recentFood: NewRecentFood): UpdateRecentFoodDTO {
  return {
    last_used: recentFood.last_used.toISOString(),
    reference_id: recentFood.reference_id,
    times_used: recentFood.times_used,
    user_id: recentFood.user_id,
    type: recentFood.type,
  }
}

function toInsertDTO(recentFood: NewRecentFood): InsertRecentFoodDTO {
  return {
    last_used: recentFood.last_used.toISOString(),
    reference_id: recentFood.reference_id,
    times_used: recentFood.times_used,
    user_id: recentFood.user_id,
    type: recentFood.type,
  }
}

function toDomain(recentFoodDTO: RecentFoodDTO): RecentFood {
  return parseWithStack(recentFoodSchema, {
    id: recentFoodDTO.id,
    reference_id: recentFoodDTO.reference_id,
    times_used: recentFoodDTO.times_used,
    last_used: new Date(recentFoodDTO.last_used),
    user_id: recentFoodDTO.user_id,
    type: recentFoodDTO.type,
  })
}

export function createSupabaseRecentFoodGateway() {
  return {
    fetchByUserTypeAndReferenceId,
    fetchUserRecentFoodsAsTemplates,
    insert,
    update,
    deleteByReference,
  }
}

async function fetchByUserTypeAndReferenceId(
  userId: User['uuid'],
  type: RecentFood['type'],
  referenceId: number,
): Promise<RecentFood | null> {
  const { data, error } = await supabase
    .from(SUPABASE_TABLE_RECENT_FOODS)
    .select('*')
    .eq('user_id', userId)
    .eq('type', type)
    .eq('reference_id', referenceId)
    .single()

  if (error !== null) throw error

  return toDomain(data)
}

async function fetchUserRecentFoodsAsTemplates(
  userId: User['uuid'],
  search: string,
  opts?: { limit?: number },
): Promise<readonly Template[]> {
  const limit = opts?.limit
  const normalizedSearch =
    search.trim() !== '' ? removeDiacritics(search.trim()) : undefined

  const response = await supabase.rpc('search_recent_foods_with_names', {
    p_user_uuid: userId,
    p_search_term: normalizedSearch ?? undefined,
    p_limit: limit,
  })

  if (response.error !== null) throw response.error

  const validatedData = parseWithStack(
    enhancedRecentFoodRowSchema.array(),
    response.data,
  )

  return validatedData.map((row) => transformRowToTemplate(row))
}

async function insert(input: NewRecentFood): Promise<RecentFood | null> {
  const insertData = toInsertDTO(input)
  const { data, error } = await supabase
    .from(SUPABASE_TABLE_RECENT_FOODS)
    .insert(insertData)
    .select()
    .single()

  if (error !== null) throw error
  return toDomain(data)
}

async function update(
  id: number,
  input: NewRecentFood,
): Promise<RecentFood | null> {
  const updateData = toUpdateDTO(input)
  const { data, error } = await supabase
    .from(SUPABASE_TABLE_RECENT_FOODS)
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error !== null) throw error
  return toDomain(data)
}

async function deleteByReference(
  userId: User['uuid'],
  type: RecentFood['type'],
  referenceId: number,
): Promise<boolean> {
  const { error } = await supabase
    .from(SUPABASE_TABLE_RECENT_FOODS)
    .delete()
    .eq('user_id', userId)
    .eq('type', type)
    .eq('reference_id', referenceId)

  if (error !== null) throw error
  return true
}
