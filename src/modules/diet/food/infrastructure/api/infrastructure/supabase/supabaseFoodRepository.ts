import { type Food, type NewFood } from '~/modules/diet/food/domain/food'
import {
  type FoodRepository,
  type FoodSearchParams,
} from '~/modules/diet/food/domain/foodRepository'
import { supabaseFoodMapper } from '~/modules/diet/food/infrastructure/api/infrastructure/supabase/supabaseFoodMapper'
import { SUPABASE_TABLE_FOODS } from '~/modules/diet/food/infrastructure/supabase/constants'
import { supabase } from '~/shared/supabase/supabase'
import { isSupabaseDuplicateEanError } from '~/shared/supabase/supabaseErrorUtils'
import { wrapErrorWithStack } from '~/shared/utils/errorUtils'
import { logging } from '~/shared/utils/logging'

export function createSupabaseFoodRepository(): FoodRepository {
  return {
    fetchFoods,
    fetchFoodById,
    fetchFoodsByName,
    fetchFoodByEan,
    insertFood,
    upsertFood,
    fetchFoodsByIds,
  }
}

/**
 * Fetches a Food by its ID.
 * Throws on error or if not found.
 * @param id - The Food ID
 * @param params - Optional search params
 * @returns The Food
 * @throws Error if not found or on API/validation error
 */
async function fetchFoodById(
  id: Food['id'],
  params: Omit<FoodSearchParams, 'limit'> = {},
): Promise<Food> {
  try {
    const foods = await internalCachedSearchFoods(
      { field: 'id', value: id },
      { ...params, limit: 1 },
    )
    if (foods.length === 0 || foods[0] === undefined) {
      logging.error('Food not found')
      throw new Error('Food not found')
    }
    return foods[0]
  } catch (err) {
    logging.error('Food fetch error:', err)
    throw err
  }
}

/**
 * Fetches a Food by its EAN.
 * Throws on error or if not found.
 * @param ean - The Food EAN
 * @param params - Optional search params
 * @returns The Food
 * @throws Error if not found or on API/validation error
 */
async function fetchFoodByEan(
  ean: NonNullable<Required<Food>['ean']>,
  params: Omit<FoodSearchParams, 'limit'> = {},
): Promise<Food> {
  try {
    const foods = await internalCachedSearchFoods(
      { field: 'ean', value: ean },
      { ...params, limit: 1 },
    )
    if (foods.length === 0 || foods[0] === undefined) {
      logging.error('Food not found')
      throw new Error('Food not found')
    }
    return foods[0]
  } catch (err) {
    logging.error('Food fetch error:', err)
    throw err
  }
}

/**
 * Inserts a new Food.
 * Throws on error or if not created.
 * @param newFood - The new Food
 * @returns The created Food
 * @throws Error if not created or on API/validation error
 */
async function insertFood(newFood: NewFood): Promise<Food> {
  const insertDTO = supabaseFoodMapper.toInsertDTO(newFood)
  const { data, error } = await supabase
    .from(SUPABASE_TABLE_FOODS)
    .insert(insertDTO)
    .select()
    .single()

  if (error !== null) {
    if (isSupabaseDuplicateEanError(error, newFood.ean)) {
      return await fetchFoodByEan(newFood.ean)
    }
    logging.error('Food insert error:', error)
    throw wrapErrorWithStack(error)
  }

  return supabaseFoodMapper.toDomain(data)
}

/**
 * Upserts a Food.
 * Throws on error or if not created.
 * @param newFood - The new Food
 * @returns The upserted Food
 * @throws Error if not created or on API/validation error
 */
async function upsertFood(newFood: NewFood): Promise<Food> {
  const createDTO = supabaseFoodMapper.toInsertDTO(newFood)
  const { data: food, error } = await supabase
    .from(SUPABASE_TABLE_FOODS)
    .upsert(createDTO)
    .select()
    .single()

  if (error !== null) {
    if (isSupabaseDuplicateEanError(error, newFood.ean)) {
      return await fetchFoodByEan(newFood.ean)
    }
    logging.error('Food insert error:', error)
    throw wrapErrorWithStack(error)
  }

  return supabaseFoodMapper.toDomain(food)
}

async function fetchFoodsByName(
  name: Required<Food>['name'],
  params: FoodSearchParams = {},
) {
  const { userId, isFavoritesSearch, limit = 50 } = params

  try {
    let result
    if (isFavoritesSearch === true && userId !== undefined) {
      // Search within favorites only using optimized RPC
      result = await supabase.rpc('search_favorite_foods_with_scoring', {
        p_user_uuid: userId,
        p_search_term: name,
        p_limit: limit,
      })
    } else {
      // Use standard search for all foods
      result = await supabase.rpc('search_foods_with_scoring', {
        p_search_term: name,
        p_limit: limit,
      })
    }

    if (result.error !== null) {
      logging.error('Food search error:', result.error)
      throw wrapErrorWithStack(result.error)
    }

    const resultsCount = Array.isArray(result.data) ? result.data.length : 0
    const searchType =
      isFavoritesSearch === true && userId !== undefined
        ? 'favorites search'
        : 'enhanced search'

    logging.debug(`Found ${resultsCount} foods using ${searchType}`)
    return result.data.map(supabaseFoodMapper.toDomain)
  } catch (err) {
    logging.error('Food search error:', err)
    throw err
  }
}

async function fetchFoods(params: FoodSearchParams = {}) {
  return await internalCachedSearchFoods({ field: '', value: '' }, params)
}

async function internalCachedSearchFoods(
  {
    field,
    value,
    operator = 'eq',
  }:
    | {
        field: 'ean' | 'id' | 'name'
        value: NonNullable<Food['ean' | 'id' | 'name']>
        operator?: 'eq' | 'ilike'
      }
    | {
        field: ''
        value: ''
        operator?: 'eq' | 'ilike'
      },
  params?: FoodSearchParams,
): Promise<readonly Food[]> {
  logging.debug(
    `Searching for foods with ${field} = ${value} (limit: ${
      params?.limit ?? 'none'
    })`,
  )
  const { limit, allowedFoods } = params ?? {}
  const base = supabase
    .from(SUPABASE_TABLE_FOODS)
    .select('*')
    .not('name', 'eq', '')
    .not('name', 'eq', '.')
    .order('name', { ascending: true })

  let query = base

  if (field !== '' && value !== '') {
    const normalizedValue = value
    switch (operator) {
      case 'eq':
        query = query.eq(field, normalizedValue)
        break
      case 'ilike':
        query = query.ilike(field, `%${normalizedValue}%`)
        break
      default:
        operator satisfies never
    }
  }

  if (allowedFoods !== undefined) {
    logging.debug('Limiting search to allowed foods')
    query = query.in('id', allowedFoods)
  }

  if (limit !== undefined) {
    logging.debug(`Limiting search to ${limit} results`)
    query = query.limit(limit)
  }

  const { data: foods, error } = await query
  if (error !== null) {
    logging.error('Food insert error:', error)
    throw wrapErrorWithStack(error)
  }

  logging.debug(`Found ${foods.length} foods`)
  return foods.map(supabaseFoodMapper.toDomain)
}

/**
 * Fetches foods by an array of IDs.
 * @param ids - Array of Food IDs.
 * @returns Array of foods matching the IDs.
 */
async function fetchFoodsByIds(ids: Food['id'][]): Promise<readonly Food[]> {
  if (!Array.isArray(ids) || ids.length === 0) return []
  const { data: foods, error } = await supabase
    .from(SUPABASE_TABLE_FOODS)
    .select('*')
    .in('id', ids)

  if (error !== null) {
    logging.error('Food insert error:', error)
    throw wrapErrorWithStack(error)
  }

  return foods.map(supabaseFoodMapper.toDomain)
}
