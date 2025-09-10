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
import { trackBarcodeSearch, trackFoodSearch } from '~/shared/performance'
import { withUISpan } from '~/shared/utils/tracing'

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
 * Fetches a food by ID.
 * @param id - Food ID.
 * @param params - Search parameters.
 * @returns Food or null on error.
 */
export async function fetchFoodById(
  id: Food['id'],
  params: FoodSearchParams = {},
): Promise<Food | null> {
  try {
    return await foodRepository.fetchFoodById(id, params)
  } catch (error) {
    errorHandler.error(error, {
      entityId: id,
    })
    if (isBackendOutageError(error)) setBackendOutage(true)
    return null
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
  return await trackFoodSearch(name, async () => {
    return withUISpan('FoodSearch', 'fetchByName', async (span) => {
      try {
        span.setAttributes({
          'search.query': name,
          'search.limit': params.limit ?? 0,
          'search.cached': false, // Will be updated after cache check
        })

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

        span.setAttributes({
          'result.count': foods.length,
          'search.cached': isCached,
        })

        return foods
      } catch (error) {
        errorHandler.error(error, {
          additionalData: { name },
        })
        if (isBackendOutageError(error)) setBackendOutage(true)
        return []
      }
    })
  })
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
  return await trackBarcodeSearch(ean, async () => {
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
  })
}

/**
 * Checks if a food EAN is cached.
 * @param ean - Food EAN.
 * @returns True if cached, false otherwise.
 */
export async function isEanCached(
  ean: NonNullable<Required<Food>['ean']>,
): Promise<boolean> {
  try {
    const cached = (await foodRepository.fetchFoodByEan(ean, {})) !== null
    return cached
  } catch (error) {
    errorHandler.error(error, {
      additionalData: { ean },
    })
    if (isBackendOutageError(error)) setBackendOutage(true)
    return false
  }
}

/**
 * Fetches foods by IDs.
 * @param ids - Array of food IDs.
 * @returns Array of foods or empty array on error.
 */
export async function fetchFoodsByIds(
  ids: Food['id'][],
): Promise<readonly Food[]> {
  try {
    return await foodRepository.fetchFoodsByIds(ids)
  } catch (error) {
    errorHandler.error(error, {
      additionalData: { ids },
    })
    if (isBackendOutageError(error)) setBackendOutage(true)
    return []
  }
}
