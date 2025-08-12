// Infrastructure layer for recent food - Supabase implementation
import { z } from 'zod/v4'

import { foodSchema } from '~/modules/diet/food/domain/food'
import { recipeSchema } from '~/modules/diet/recipe/domain/recipe'
import type {
  RecentFoodInput,
  RecentFoodRecord,
  RecentFoodRepository,
  RecentFoodType,
} from '~/modules/recent-food/domain/recentFood'
import { createErrorHandler } from '~/shared/error/errorHandler'
import { parseWithStack } from '~/shared/utils/parseWithStack'
import { removeDiacritics } from '~/shared/utils/removeDiacritics'
import { supabase } from '~/shared/utils/supabase'
import { withDatabaseSpan } from '~/shared/utils/tracing'

const TABLE = 'recent_foods'

// Database record schema for validation
const recentFoodRecordSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  type: z.enum(['food', 'recipe']),
  reference_id: z.number(),
  last_used: z.coerce.date(),
  times_used: z.number(),
})

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
    type: RecentFoodType,
    referenceId: number,
  ): Promise<RecentFoodRecord | null> {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('user_id', userId)
        .eq('type', type)
        .eq('reference_id', referenceId)
      if (error !== null) throw error

      const records = parseWithStack(recentFoodRecordSchema.array(), data)
      return records.at(0) ?? null
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
    return withDatabaseSpan(
      'search_recent_foods',
      'recent_foods',
      async (span) => {
        try {
          const limit = opts?.limit
          const normalizedSearch =
            search.trim() !== '' ? removeDiacritics(search.trim()) : undefined

          span.setAttributes({
            'user.id': userId,
            'search.term': search,
            'search.normalized': normalizedSearch ?? '',
            'query.limit': limit ?? 0,
          })

          const response = await supabase.rpc(
            'search_recent_foods_with_names',
            {
              p_user_id: userId,
              p_search_term: normalizedSearch ?? null,
              p_limit: limit,
            },
          )
          if (response.error !== null) throw response.error

          const result = parseWithStack(
            enhancedRecentFoodRowSchema.array(),
            response.data,
          )
          span.setAttribute('result.count', result.length)

          // Return raw validated data for application layer to transform
          return result
        } catch (error) {
          errorHandler.error(error)
          return []
        }
      },
    )
  },

  async insert(input: RecentFoodInput): Promise<RecentFoodRecord | null> {
    return withDatabaseSpan('insert', 'recent_foods', async (span) => {
      try {
        const insertData = {
          user_id: input.user_id,
          type: input.type,
          reference_id: input.reference_id,
          last_used: input.last_used ?? new Date(),
          times_used: input.times_used ?? 1,
        }

        span.setAttributes({
          'user.id': input.user_id,
          'recent_food.type': input.type,
          'recent_food.reference_id': input.reference_id,
        })

        const { data, error } = await supabase
          .from(TABLE)
          .insert(insertData)
          .select()
        if (error !== null) throw error

        const result = parseWithStack(recentFoodRecordSchema, data[0])
        span.setAttribute('recent_food.id', result.id)

        return result
      } catch (error) {
        errorHandler.error(error)
        return null
      }
    })
  },

  async update(
    id: number,
    input: RecentFoodInput,
  ): Promise<RecentFoodRecord | null> {
    try {
      const updateData = {
        user_id: input.user_id,
        type: input.type,
        reference_id: input.reference_id,
        last_used: input.last_used ?? new Date(),
        times_used: input.times_used ?? 1,
      }
      const { data, error } = await supabase
        .from(TABLE)
        .update(updateData)
        .eq('id', id)
        .select()
      if (error !== null) throw error
      return parseWithStack(recentFoodRecordSchema, data[0])
    } catch (error) {
      errorHandler.error(error)
      return null
    }
  },

  async deleteByReference(
    userId: number,
    type: RecentFoodType,
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
