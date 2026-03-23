import { type Food } from '~/modules/diet/food/domain/food'
import { type FoodSearchParams } from '~/modules/diet/food/domain/foodRepository'
import { type FoodRepository } from '~/modules/diet/food/domain/foodRepository'
import {
  importFoodFromApiByEan,
  importFoodsFromApiByName,
} from '~/modules/diet/food/infrastructure/api/application/apiFood'
import { createCachedSearchCrud } from '~/modules/search/application/usecases/cachedSearchCrud'
import { showPromise } from '~/modules/toast/application/toastManager'
import { setBackendOutage } from '~/shared/error/backendOutageSignal'
import { formatError } from '~/shared/formatError'
import { isBackendOutageError } from '~/shared/utils/errorUtils'
import { logging } from '~/shared/utils/logging'

/**
 * Factory that returns food-related use-cases with injected dependencies.
 * Allows replacing the repository implementation (e.g. for guest mode or tests).
 */
export function createFoodCrud(deps: { repository: () => FoodRepository }) {
  const foodRepository = deps.repository()
  const cachedSearchCrud = createCachedSearchCrud()

  return {
    async fetchFoods(params: FoodSearchParams = {}): Promise<readonly Food[]> {
      try {
        return await foodRepository.fetchFoods(params)
      } catch (error) {
        logging.error('Food application error:', error)
        if (isBackendOutageError(error)) setBackendOutage(true)
        return []
      }
    },

    async fetchFoodsByName(
      name: Required<Food>['name'],
      params: FoodSearchParams = {},
    ): Promise<readonly Food[]> {
      try {
        const isCached = await cachedSearchCrud.isSearchCached(name)

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
        logging.error('Food application error:', error)
        if (isBackendOutageError(error)) setBackendOutage(true)
        return []
      }
    },

    async fetchFoodByEan(
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
        logging.error('Food application error:', error)
        if (isBackendOutageError(error)) setBackendOutage(true)
        return null
      }
    },
  }
}

/**
 * Convenience type for the concrete use-cases returned by the factory.
 */
export type FoodCrud = ReturnType<typeof createFoodCrud>
