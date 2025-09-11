import axios from 'axios'

import { type Food } from '~/modules/diet/food/domain/food'
import { type ApiFood } from '~/modules/diet/food/infrastructure/api/domain/apiFoodSchema'
import { createSupabaseFoodRepository } from '~/modules/diet/food/infrastructure/api/infrastructure/supabase/supabaseFoodRepository'
import { markSearchAsCached } from '~/modules/search/application/usecases/cachedSearchCrud'
import { showError } from '~/modules/toast/application/toastManager'
import { convertApi2Food } from '~/shared/utils/convertApi2Food'
import { ORIGINAL_ERROR_SYMBOL } from '~/shared/utils/errorUtils'
import { logging } from '~/shared/utils/logging'

const foodRepository = createSupabaseFoodRepository()

export async function importFoodFromApiByEan(
  ean: Food['ean'],
): Promise<Food | null> {
  if (ean === null) {
    logging.error('EAN is required to import food from API:', { ean })
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const apiFood = (await axios.get(`/api/food/ean/${ean}`)).data

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (apiFood.id === 0) {
    logging.error(`Food with ean ${ean} not found on external api:`, { ean })
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const food = convertApi2Food(apiFood)
  const upsertedFood = await foodRepository.upsertFood(food)
  return upsertedFood
}

export async function importFoodsFromApiByName(name: string): Promise<Food[]> {
  logging.debug(`Importing foods with name "${name}"`)

  const apiFoods = (await axios.get<ApiFood[]>(`/api/food/name/${name}`)).data

  if (apiFoods.length === 0) {
    showError(`Nenhum alimento encontrado para "${name}"`)
    return []
  }

  logging.debug(`Found ${apiFoods.length} foods`)

  const foodsToupsert = apiFoods.map(convertApi2Food)

  const upsertPromises = foodsToupsert.map(foodRepository.upsertFood)

  const upsertionResults = await Promise.allSettled(upsertPromises)
  logging.debug(
    `upserted ${upsertionResults.length} foods. ${
      upsertionResults.filter((result) => result.status === 'fulfilled').length
    } succeeded, ${
      upsertionResults.filter((result) => result.status === 'rejected').length
    } failed`,
  )

  if (upsertionResults.some((result) => result.status === 'rejected')) {
    logging.debug(`Erros de upsert: `, { upsertionResults })
    const allRejected = upsertionResults.filter(
      (result) => result.status === 'rejected',
    )

    const reasons = allRejected.map((result) => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const reason: Error = result.reason as unknown as Error
      return reason
    })
    const errors = reasons.map(
      // eslint-disable-next-line
      (reason) => (reason as any)[ORIGINAL_ERROR_SYMBOL].code as string,
    )
    logging.debug(`Readable errors:`, { errors })

    const ignoredErrors = [
      '23505', // Unique violation: food already exists, ignore
    ]

    const relevantErrors = errors.filter(
      (error) => !ignoredErrors.includes(error),
    )

    if (relevantErrors.length > 0) {
      logging.debug(`Relevant errors:`, { relevantErrors })
      logging.error(`Failed to upsert ${relevantErrors.length} foods:`, {
        operation: 'searchAndUpsertFoodsByNameFromApi',
        name,
        relevantErrors,
        errorCount: relevantErrors.length,
      })

      showError(
        `Erro ao importar alguns alimentos: ${relevantErrors.length} falhas. Verifique o console para mais detalhes.`,
        { context: 'user-action' },
      )
    } else {
      logging.debug('No RELEVANT failed upsertions, marking search as cached')
      await markSearchAsCached(name)
    }
  } else {
    logging.debug('No failed upsertions, marking search as cached')
    await markSearchAsCached(name)
  }

  const upsertedFoods: ReadonlyArray<Food | null> = upsertionResults
    .filter(
      (result): result is PromiseFulfilledResult<Food | null> =>
        result.status === 'fulfilled',
    )
    .map((result) => result.value)

  logging.debug(` Returning ${upsertedFoods.length}/${apiFoods.length} foods`)

  return upsertedFoods.filter((food): food is Food => food !== null)
}
