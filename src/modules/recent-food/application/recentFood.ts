// Application layer for recent food operations - pure business logic
import type { Template } from '~/modules/diet/template/domain/template'
import {
  createRecentFoodInput,
  type RecentFoodCreationParams,
  type RecentFoodInput,
  type RecentFoodRecord,
  type RecentFoodRepository,
  type RecentFoodType,
} from '~/modules/recent-food/domain/recentFood'
import {
  supabaseRecentFoodRepository,
  transformRowToTemplate,
} from '~/modules/recent-food/infrastructure/supabaseRecentFoodRepository'
import { showPromise } from '~/modules/toast/application/toastManager'
import env from '~/shared/config/env'
import { createErrorHandler } from '~/shared/error/errorHandler'

// Default repository implementation (can be swapped for testing)
const recentFoodRepository: RecentFoodRepository = supabaseRecentFoodRepository

/**
 * Fetches a recent food by user, type and reference ID.
 * @param userId - The user ID.
 * @param type - The type ('food' | 'recipe').
 * @param referenceId - The reference ID (foods.id ou recipes.id).
 * @returns The recent food record or null if not found or on error.
 */
const errorHandler = createErrorHandler('application', 'RecentFood')

export async function fetchRecentFoodByUserTypeAndReferenceId(
  userId: number,
  type: RecentFoodType,
  referenceId: number,
): Promise<RecentFoodRecord | null> {
  return recentFoodRepository.fetchByUserTypeAndReferenceId(
    userId,
    type,
    referenceId,
  )
}

/**
 * Fetches recent foods as Templates for a user with optional limit and search filtering.
 * Uses the enhanced database function to return complete Template objects directly.
 * @param userId - The user ID.
 * @param search - Search term to filter by food/recipe names (case and diacritic insensitive).
 * @param opts - Optional configuration with limit for maximum number of recent foods to fetch.
 * @returns Array of Template objects or empty array on error.
 */
export async function fetchUserRecentFoods(
  userId: number,
  search: string,
  opts?: { limit?: number },
): Promise<readonly Template[]> {
  const limit = opts?.limit ?? env.VITE_RECENT_FOODS_DEFAULT_LIMIT
  try {
    const rawRows = await recentFoodRepository.fetchUserRecentFoodsRaw(
      userId,
      search,
      { limit },
    )

    // Transform raw data to Template objects
    const templates = rawRows.map((row) => transformRowToTemplate(row))
    return templates
  } catch (error) {
    errorHandler.error(error)
    return []
  }
}

/**
 * Inserts a new recent food.
 * @param recentFoodInput - The new recent food data.
 * @returns The inserted recent food record or null on error.
 */
export async function insertRecentFood(
  recentFoodInput: RecentFoodInput,
): Promise<RecentFoodRecord | null> {
  try {
    return await showPromise(
      recentFoodRepository.insert(recentFoodInput),
      {
        loading: 'Salvando alimento recente...',
        success: 'Alimento recente salvo com sucesso',
        error: 'Erro ao salvar alimento recente',
      },
      { context: 'user-action' },
    )
  } catch (error) {
    errorHandler.error(error)
    return null
  }
}

/**
 * Updates a recent food by ID.
 * @param recentFoodId - The recent food ID.
 * @param recentFoodInput - The new recent food data.
 * @returns The updated recent food record or null on error.
 */
export async function updateRecentFood(
  recentFoodId: number,
  recentFoodInput: RecentFoodInput,
): Promise<RecentFoodRecord | null> {
  try {
    return await showPromise(
      recentFoodRepository.update(recentFoodId, recentFoodInput),
      {
        loading: 'Atualizando alimento recente...',
        success: 'Alimento recente atualizado com sucesso',
        error: 'Erro ao atualizar alimento recente',
      },
      { context: 'user-action' },
    )
  } catch (error) {
    errorHandler.error(error)
    return null
  }
}

/**
 * Deletes a recent food by user, type e reference_id.
 * @param userId - The user ID.
 * @param type - The type ('food' | 'recipe').
 * @param referenceId - The reference ID.
 * @returns True if deleted, false otherwise.
 */
export async function deleteRecentFoodByReference(
  userId: number,
  type: RecentFoodType,
  referenceId: number,
): Promise<boolean> {
  try {
    return await showPromise(
      recentFoodRepository.deleteByReference(userId, type, referenceId),
      {
        loading: 'Removendo alimento recente...',
        success: 'Alimento recente removido com sucesso',
        error: 'Erro ao remover alimento recente',
      },
      { context: 'user-action' },
    )
  } catch (error) {
    errorHandler.error(error)
    return false
  }
}

// Re-export domain functions for convenience
export { createRecentFoodInput }
export type {
  RecentFoodCreationParams,
  RecentFoodInput,
  RecentFoodRecord,
  RecentFoodType,
}
