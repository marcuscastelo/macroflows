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
    '/api/food/ean/:ean',
    async (span) => {
      logging.debug('GET', params)
      
      if (params.ean === undefined || params.ean === '') {
        span.setAttribute('error', true)
        span.setAttribute('error.type', 'validation')
        return json({ error: 'EAN parameter is required' }, { status: 400 })
      }

      span.setAttribute('food.ean', params.ean)

      try {
        const apiFood = await apiFoodRepository.fetchApiFoodByEan(params.ean)
        logging.debug('apiFood', apiFood)
        span.setAttribute('food.found', true)
        return json(apiFood)
      } catch (error) {
        logging.error('API food fetch error:', error)
        span.setAttribute('error', true)
        span.setAttribute('error.type', 'fetch')
        return json(
          {
            error:
              'Error fetching food item by EAN: ' +
              (error instanceof Error ? error.message : String(error)),
          },
          {
            status: getErrorStatus(error),
          },
        )
      }
    },
    {
      'api.route': '/api/food/ean/:ean',
      'api.parameter.ean': params.ean ?? 'undefined',
    },
  )
}
