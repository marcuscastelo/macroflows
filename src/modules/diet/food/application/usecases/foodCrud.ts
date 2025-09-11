import { type Food } from '~/modules/diet/food/domain/food'
import { type FoodSearchParams } from '~/modules/diet/food/domain/foodRepository'
import {
  importFoodFromApiByEan,
  importFoodsFromApiByName,
} from '~/modules/diet/food/infrastructure/api/application/apiFood'
import { createSupabaseFoodRepository } from '~/modules/diet/food/infrastructure/api/infrastructure/supabase/supabaseFoodRepository'
import { isSearchCached } from '~/modules/search/application/usecases/cachedSearchCrud'
import { showPromise } from '~/modules/toast/application/toastManager'
import { setBackendOutage } from '~/shared/error/backendOutageSignal'
import {
  createErrorHandler,
  isBackendOutageError,
} from '~/shared/error/errorHandler'
import { formatError } from '~/shared/formatError'

const foodRepository = createSupabaseFoodRepository()
const errorHandler = createErrorHandler('application', 'Food')

/**
 * Fetches foods by search params.
 * @param params - Search parameters.
 * @returns Array of foods or empty array on error.
 */
export async function fetchFoods(
  params: FoodSearchParams = {},
): Promise<readonly Food[]> {
  try {
    return await foodRepository.fetchFoods(params)
  } catch (error) {
    errorHandler.error(error)
    if (isBackendOutageError(error)) setBackendOutage(true)
    return []
  }
}

/**
 * Fetches foods by name, importing if not cached.
 * @param name - Food name.
 * @param params - Search parameters.
 * @returns Array of foods or empty array on error.
 */
export async function fetchFoodsByName(
  name: Required<Food>['name'],
  params: FoodSearchParams = {},
): Promise<readonly Food[]> {
  try {
    const isCached = await isSearchCached(name)

    if (!isCached) {
      await showPromise(
        importFoodsFromApiByName(name),
        {
          loading: 'Importando alimentos...',
          success: 'Alimentos importados com sucesso',
          error: `Erro ao importar alimentos por nome: ${name}`,
        },
        { context: 'background' },
      )
    }

    const foods = await showPromise(
      foodRepository.fetchFoodsByName(name, params),
      {
        loading: 'Buscando alimentos por nome...',
        success: 'Alimentos encontrados',
        error: (error: unknown) =>
          `Erro ao buscar alimentos por nome: ${formatError(error)}`,
      },
      { context: 'background' },
    )

    return foods
  } catch (error) {
    errorHandler.error(error, {
      additionalData: { name },
    })
    if (isBackendOutageError(error)) setBackendOutage(true)
    return []
  }
}

/**
 * Fetches a food by EAN, importing if not cached.
 * @param ean - Food EAN.
 * @param params - Search parameters.
 * @returns Food or null on error.
 */
export async function fetchFoodByEan(
  ean: NonNullable<Food['ean']>,
  params: FoodSearchParams = {},
): Promise<Food | null> {
  try {
    await showPromise(
      importFoodFromApiByEan(ean),
      {
        loading: 'Importando alimento...',
        success: 'Alimento importado com sucesso',
        error: `Erro ao importar alimento por EAN: ${ean}`,
      },
      { context: 'background' },
    )
    return await showPromise(
      foodRepository.fetchFoodByEan(ean, params),
      {
        loading: 'Buscando alimento por EAN...',
        success: 'Alimento encontrado',
        error: (error: unknown) =>
          `Erro ao buscar alimento por EAN: ${formatError(error)}`,
      },
      { context: 'user-action' },
    )
  } catch (error) {
    errorHandler.error(error, {
      additionalData: { ean },
    })
    if (isBackendOutageError(error)) setBackendOutage(true)
    return null
  }
}
