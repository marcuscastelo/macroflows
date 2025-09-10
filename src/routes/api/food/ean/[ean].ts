import { json } from '@solidjs/router'
import { type APIEvent } from '@solidjs/start/server'

import { createApiFoodRepository } from '~/modules/diet/food/infrastructure/api/infrastructure/api/apiFoodRepository'
import { createErrorHandler } from '~/shared/error/errorHandler'
import { logging } from '~/shared/utils/logging'
import { withHttpClientSpan } from '~/shared/utils/tracing'

const apiFoodRepository = createApiFoodRepository()

const errorHandler = createErrorHandler('infrastructure', 'Food')

function getErrorStatus(error: unknown): number {
  if (error !== null && typeof error === 'object' && 'status' in error) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const status = (error as { status: unknown }).status
    return typeof status === 'number' ? status : 500
  }
  return 500
}

export async function GET({ params }: APIEvent) {
  return await withHttpClientSpan(
    'GET',
    `/api/food/ean/${params.ean}`,
    async (span) => {
      span.setAttributes({
        'http.route': '/api/food/ean/[ean]',
        'food.ean': params.ean ?? '',
        'operation.type': 'ean_lookup',
      })

      logging.debug('GET', params)
      if (params.ean === undefined || params.ean === '') {
        span.addEvent('invalid_ean_parameter')
        return json({ error: 'EAN parameter is required' }, { status: 400 })
      }

      try {
        span.addEvent('fetching_api_food', { ean: params.ean })
        const apiFood = await apiFoodRepository.fetchApiFoodByEan(params.ean)
        logging.debug('apiFood', apiFood)

        span.addEvent('api_food_fetched', {
          ean: params.ean,
          found: Boolean(apiFood),
          hasNutrition: Boolean(apiFood),
        })

        return json(apiFood)
      } catch (error) {
        span.addEvent('api_food_fetch_error', {
          ean: params.ean,
          error: String(error),
        })
        errorHandler.error(error)
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
  )
}
