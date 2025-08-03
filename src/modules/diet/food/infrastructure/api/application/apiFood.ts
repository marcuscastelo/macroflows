import axios from 'axios'

import { type Food } from '~/modules/diet/food/domain/food'
import { createSupabaseFoodRepository } from '~/modules/diet/food/infrastructure/api/infrastructure/supabase/supabaseFoodRepository'
import { markSearchAsCached } from '~/modules/search/application/usecases/cachedSearchCrud'
import { showError } from '~/modules/toast/application/toastManager'
import { createErrorHandler } from '~/shared/error/errorHandler'
import { convertApi2Food } from '~/shared/utils/convertApi2Food'

const foodRepository = createSupabaseFoodRepository()
const errorHandler = createErrorHandler('infrastructure', 'Food')

export async function importFoodFromApiByEan(
  ean: Food['ean'],
): Promise<Food | null> {
  if (ean === null) {
    errorHandler.error(new Error('EAN is required to import food from API'), {
      additionalData: { ean },
    })
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const apiFood = (await axios.get(`/api/food/ean/${ean}`)).data

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (apiFood.id === 0) {
    errorHandler.error(
      new Error(`Food with ean ${ean} not found on external api`),
      {
        additionalData: { ean },
      },
    )
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const food = convertApi2Food(apiFood)
  const upsertedFood = await foodRepository.upsertFood(food)
  return upsertedFood
}

export async function importFoodsFromApiByName(name: string): Promise<Food[]> {
  console.debug(`[ApiFood] Importing foods with name "${name}"`)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const apiFoods = (await axios.get(`/api/food/name/${name}`)).data

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (apiFoods.length === 0) {
    showError(`Nenhum alimento encontrado para "${name}"`)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  console.debug(`[ApiFood] Found ${apiFoods.length} foods`)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const foodsToupsert = apiFoods.map(convertApi2Food)

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const upsertPromises = foodsToupsert.map(foodRepository.upsertFood)

  const upsertionResults = await Promise.allSettled(upsertPromises)
  console.debug(
    `[ApiFood] upserted ${upsertionResults.length} foods. ${
      upsertionResults.filter((result) => result.status === 'fulfilled').length
    } succeeded, ${
      upsertionResults.filter((result) => result.status === 'rejected').length
    } failed`,
  )

  if (upsertionResults.some((result) => result.status === 'rejected')) {
    const allRejected = upsertionResults.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    )

    type _Reason = { code: string }
    const reasons = allRejected.map((result) => {
      const reason: unknown = result.reason
      if (typeof reason === 'object' && reason !== null && 'code' in reason) {
        return reason
      }
      return { code: 'unknown' }
    })
    const errors = reasons.map((reason) => reason.code)

    const ignoredErrors = [
      '23505', // Unique violation: food already exists, ignore
    ]

    const relevantErrors = errors.filter(
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      (error) => !ignoredErrors.includes(error as string),
    )

    if (relevantErrors.length > 0) {
      errorHandler.error(
        new Error(`Failed to upsert ${relevantErrors.length} foods`),
        {
          operation: 'searchAndUpsertFoodsByNameFromApi',

          additionalData: {
            name,
            relevantErrors,
            errorCount: relevantErrors.length,
          },
        },
      )

      showError(
        `Erro ao importar alguns alimentos: ${relevantErrors.length} falhas. Verifique o console para mais detalhes.`,
        { context: 'background' },
      )
    }
  } else {
    console.debug('[ApiFood] No failed upsertions, marking search as cached')
    await markSearchAsCached(name)
  }

  const upsertedFoods: ReadonlyArray<Food | null> = upsertionResults
    .filter(
      (result): result is PromiseFulfilledResult<Food | null> =>
        result.status === 'fulfilled',
    )
    .map((result) => result.value)

  console.debug(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    `[ApiFood] Returning ${upsertedFoods.length}/${apiFoods.length} foods`,
  )

  return upsertedFoods.filter((food): food is Food => food !== null)
}
