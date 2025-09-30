import { z } from 'zod/v4'

import { foodSchema } from '~/modules/diet/food/domain/food'
import { recipeSchema } from '~/modules/diet/recipe/domain/recipe'
import type { Template } from '~/modules/diet/template/domain/template'
import {
  type NewRecentFood,
  type RecentFood,
} from '~/modules/recent-food/domain/recentFood'
import { SUPABASE_TABLE_RECENT_FOODS } from '~/modules/recent-food/infrastructure/supabase/constants'
import { supabaseRecentFoodMapper } from '~/modules/recent-food/infrastructure/supabase/supabaseRecentFoodMapper'
import { type User } from '~/modules/user/domain/user'
import { supabase } from '~/shared/supabase/supabase'
import { parseWithStack } from '~/shared/utils/parseWithStack'

// Schema for the enhanced database function response
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

// Helper function to safely get recipe fields
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

// Helper function to transform raw database data to Template objects
function transformRowToTemplate(row: unknown): Template {
  const validatedRow = parseWithStack(enhancedRecentFoodRowSchema, row)

  if (validatedRow.type === 'food') {
    return parseWithStack(foodSchema, {
      id: validatedRow.template_id,
      name: validatedRow.template_name,
      ean: validatedRow.template_ean,
      source: validatedRow.template_source,
      macros: validatedRow.template_macros,
      __type: 'Food',
    })
  } else {
    const { user_id: user_id, preparedMultiplier } =
      getRecipeFields(validatedRow)
    return parseWithStack(recipeSchema, {
      id: validatedRow.template_id,
      name: validatedRow.template_name,
      user_id,
      items: validatedRow.template_items,
      prepared_multiplier: preparedMultiplier,
      __type: 'Recipe',
    })
  }
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

  return supabaseRecentFoodMapper.toDomain(data)
}

async function fetchUserRecentFoodsAsTemplates(
  userId: User['uuid'],
  search: string,
  opts?: { limit?: number },
): Promise<readonly Template[]> {
  const limit = opts?.limit
  const searchTerm = search.trim() !== '' ? search.trim() : undefined

  const response = await supabase.rpc('search_recent_foods_with_names', {
    p_user_uuid: userId,
    p_search_term: searchTerm ?? undefined,
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
  const insertData = supabaseRecentFoodMapper.toInsertDTO(input)
  const { data, error } = await supabase
    .from(SUPABASE_TABLE_RECENT_FOODS)
    .insert(insertData)
    .select()
    .single()
  if (error !== null) throw error
  return supabaseRecentFoodMapper.toDomain(data)
}

async function update(
  id: number,
  input: NewRecentFood,
): Promise<RecentFood | null> {
  const updateData = supabaseRecentFoodMapper.toUpdateDTO(input)
  const { data, error } = await supabase
    .from(SUPABASE_TABLE_RECENT_FOODS)
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  if (error !== null) throw error
  return supabaseRecentFoodMapper.toDomain(data)
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
