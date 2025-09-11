import { json } from '@solidjs/router'
import { type APIEvent } from '@solidjs/start/server'

import { createApiFoodRepository } from '~/modules/diet/food/infrastructure/api/infrastructure/api/apiFoodRepository'
import { logging } from '~/shared/utils/logging'
// Simplified error handling - no errorHandler needed

const apiFoodRepository = createApiFoodRepository()

function getErrorStatus(error: unknown): number {
  if (error !== null && typeof error === 'object' && 'status' in error) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const status = (error as { status: unknown }).status
    return typeof status === 'number' ? status : 500
  }
  return 500
}

export async function GET({ params }: APIEvent) {
  logging.debug('GET', params)
  if (params.name === undefined || params.name === '') {
    return json({ error: 'Name parameter is required' }, { status: 400 })
  }
  try {
    const apiFood = await apiFoodRepository.fetchApiFoodsByName(
      decodeURIComponent(params.name),
    )
    logging.debug('apiFood', { apiFood })
    return json(apiFood)
  } catch (error) {
    logging.error('API food fetch error:', error)
    return json(
      {
        error:
          'Error fetching food items by name: ' +
          (error instanceof Error ? error.message : String(error)),
      },
      {
        status: getErrorStatus(error),
      },
    )
  }
}
