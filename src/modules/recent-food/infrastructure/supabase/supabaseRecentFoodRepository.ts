// Infrastructure layer for recent food - Supabase implementation
import { z } from 'zod/v4'

import { foodSchema } from '~/modules/diet/food/domain/food'
import { recipeSchema } from '~/modules/diet/recipe/domain/recipe'
import {
  type NewRecentFood,
  type RecentFood,
} from '~/modules/recent-food/domain/recentFood'
import { type RecentFoodRepository } from '~/modules/recent-food/domain/recentFoodRepository'
import { supabaseRecentFoodMapper } from '~/modules/recent-food/infrastructure/supabase/supabaseRecentFoodMapper'
import { createErrorHandler } from '~/shared/error/errorHandler'
import { supabase } from '~/shared/supabase/supabase'
import { parseWithStack } from '~/shared/utils/parseWithStack'
import { removeDiacritics } from '~/shared/utils/removeDiacritics'

const TABLE = 'recent_foods'

// Schema for the enhanced database function response
const enhancedRecentFoodRowSchema = z
  .object({
    recent_food_id: z.number(),
    user_id: z.number(),
    type: z.enum(['food', 'recipe']),
    reference_id: z.number(),
    last_used: z.coerce.date(),
    times_used: z.number(),
    template_id: z.number(),
    template_name: z.string(),
    template_ean: z.string().nullable(),
    template_source: z.unknown(),
    template_macros: z.unknown(),
    template_owner: z.number().nullable(),
    template_items: z.unknown(),
    template_prepared_multiplier: z.number().nullable(),
  })
  .strip()

// Helper function to safely get recipe fields
function getRecipeFields(row: z.infer<typeof enhancedRecentFoodRowSchema>) {
  if (row.type !== 'recipe') {
    throw new Error('Expected recipe type but got food')
  }

  const owner = row.template_owner
  const preparedMultiplier = row.template_prepared_multiplier

  if (owner === null || preparedMultiplier === null) {
    throw new Error('Recipe fields cannot be null')
  }

  return { owner, preparedMultiplier }
}

// Supabase implementation of the repository
export const supabaseRecentFoodRepository: RecentFoodRepository = {
  async fetchByUserTypeAndReferenceId(
    userId: number,
    type: RecentFood['type'],
    referenceId: number,
  ): Promise<RecentFood | null> {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('user_id', userId)
        .eq('type', type)
        .eq('reference_id', referenceId)
        .single()

      if (error !== null) throw error

      return supabaseRecentFoodMapper.toDomain(data)
    } catch (error) {
      errorHandler.error(error)
      return null
    }
  },

  async fetchUserRecentFoodsRaw(
    userId: number,
    search: string,
    opts?: { limit?: number },
  ): Promise<readonly unknown[]> {
    try {
      const limit = opts?.limit
      const normalizedSearch =
        search.trim() !== '' ? removeDiacritics(search.trim()) : undefined

      const response = await supabase.rpc('search_recent_foods_with_names', {
        p_user_id: userId,
        p_search_term: normalizedSearch ?? undefined,
        p_limit: limit,
      })
      if (response.error !== null) throw response.error

      // Return raw validated data for application layer to transform
      return parseWithStack(enhancedRecentFoodRowSchema.array(), response.data)
    } catch (error) {
      errorHandler.error(error)
      return []
    }
  },

  async insert(input: NewRecentFood): Promise<RecentFood | null> {
    try {
      const insertData = supabaseRecentFoodMapper.toInsertDTO(input)
      const { data, error } = await supabase
        .from(TABLE)
        .insert(insertData)
        .select()
        .single()
      if (error !== null) throw error
      return supabaseRecentFoodMapper.toDomain(data)
    } catch (error) {
      errorHandler.error(error)
      return null
    }
  },

  async update(id: number, input: NewRecentFood): Promise<RecentFood | null> {
    try {
      const updateData = supabaseRecentFoodMapper.toUpdateDTO(input)
      const { data, error } = await supabase
        .from(TABLE)
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      if (error !== null) throw error
      return supabaseRecentFoodMapper.toDomain(data)
    } catch (error) {
      errorHandler.error(error)
      return null
    }
  },

  async deleteByReference(
    userId: number,
    type: RecentFood['type'],
    referenceId: number,
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq('user_id', userId)
        .eq('type', type)
        .eq('reference_id', referenceId)
      if (error !== null) throw error
      return true
    } catch (error) {
      errorHandler.error(error)
      return false
    }
  },
}

// Helper function to transform raw database data to Template objects
const errorHandler = createErrorHandler('infrastructure', 'RecentFood')

export function transformRowToTemplate(row: unknown) {
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
    const { owner, preparedMultiplier } = getRecipeFields(validatedRow)
    return parseWithStack(recipeSchema, {
      id: validatedRow.template_id,
      name: validatedRow.template_name,
      owner,
      items: validatedRow.template_items,
      prepared_multiplier: preparedMultiplier,
      __type: 'Recipe',
    })
  }
}
