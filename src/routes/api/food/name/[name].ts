import { json } from '@solidjs/router'
import { type APIEvent } from '@solidjs/start/server'

import { createApiFoodRepository } from '~/modules/diet/food/infrastructure/api/infrastructure/api/apiFoodRepository'
import { logging } from '~/shared/utils/logging'
import { traceApiRoute } from '~/shared/utils/tracing'
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
  return await traceApiRoute(
    'GET',
    '/api/food/name/:name',
    async (span) => {
      logging.debug('GET', params)
      
      if (params.name === undefined || params.name === '') {
        span.setAttribute('error', true)
        span.setAttribute('error.type', 'validation')
        return json({ error: 'Name parameter is required' }, { status: 400 })
      }
      
      const decodedName = decodeURIComponent(params.name)
      span.setAttribute('food.name', decodedName)
      
      try {
        const apiFood = await apiFoodRepository.fetchApiFoodsByName(decodedName)
        logging.debug('apiFood', { apiFood })
        span.setAttribute('food.count', apiFood.length)
        return json(apiFood)
      } catch (error) {
        logging.error('API food fetch error:', error)
        span.setAttribute('error', true)
        span.setAttribute('error.type', 'fetch')
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
    },
    {
      'api.route': '/api/food/name/:name',
      'api.parameter.name': params.name ?? 'undefined',
    },
  )
}
