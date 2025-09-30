import axios from 'axios'
import rateLimit from 'axios-rate-limit'

import {
  EXTERNAL_API_AUTHORIZATION,
  EXTERNAL_API_BASE_URL,
  EXTERNAL_API_EAN_ENDPOINT,
  EXTERNAL_API_FOOD_ENDPOINT,
  EXTERNAL_API_FOOD_PARAMS,
  EXTERNAL_API_HOST,
  EXTERNAL_API_REFERER,
} from '~/modules/diet/api/constants/apiSecrets'
import { type ApiFoodRepository } from '~/modules/diet/food/infrastructure/api/domain/apiFoodRepository'
import {
  type ApiFood,
  apiFoodSchema,
} from '~/modules/diet/food/infrastructure/api/domain/apiFoodSchema'
import { wrapErrorWithStack } from '~/shared/utils/errorUtils'
import { jsonParseWithStack } from '~/shared/utils/jsonParseWithStack'
import { logging } from '~/shared/utils/logging'
import { parseWithStack } from '~/shared/utils/parseWithStack'
import { traceHttpRequest } from '~/shared/utils/tracing'

const API = rateLimit(axios.create(), {
  maxRequests: 2,
  perMilliseconds: 1000,
  maxRPS: 2,
})

export function createApiFoodRepository(): ApiFoodRepository {
  return {
    fetchApiFoodByEan,
    fetchApiFoods,
    fetchApiFoodsByName,
  }
}

async function fetchApiFoods(): Promise<readonly ApiFood[]> {
  return await fetchApiFoodsByName('')
}

async function fetchApiFoodsByName(
  name: Required<ApiFood>['nome'],
): Promise<readonly ApiFood[]> {
  const url = `${EXTERNAL_API_BASE_URL}/${EXTERNAL_API_FOOD_ENDPOINT}`

  return await traceHttpRequest(
    'GET',
    url,
    async (span) => {
      span.setAttribute('external.api', 'food_database')
      span.setAttribute('external.api.operation', 'search_by_name')
      span.setAttribute('food.search.query', name)

      let parsedParams: unknown
      try {
        parsedParams = jsonParseWithStack(EXTERNAL_API_FOOD_PARAMS)
      } catch (err) {
        logging.error('API food parse error:', err)
        parsedParams = {}
      }
      const params =
        typeof parsedParams === 'object' && parsedParams !== null
          ? parsedParams
          : {}

      const config = {
        headers: {
          accept: 'application/json, text/plain, */*',
          'accept-encoding': 'gzip',
          'app-token': 'wapstore',
          authorization: EXTERNAL_API_AUTHORIZATION,
          connection: 'Keep-Alive',
          host: EXTERNAL_API_HOST,
          referer: EXTERNAL_API_REFERER,
          'user-agent': 'okhttp/4.9.2',
        },
        params: {
          ...params,
          search: name,
        },
      }

      logging.debug(`[ApiFood] Fetching foods with name from url ${url}`, config)
      let response
      try {
        response = await API.get(url, config)
        span.setAttribute('http.status_code', response.status)
      } catch (error) {
        logging.error('API food fetch error:', error)
        span.setAttribute('error', true)
        throw wrapErrorWithStack(error)
      }

      logging.debug(`[ApiFood] Response from url ${url}`, { response })

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const data = response.data
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const alimentosRaw = data.alimentos
      if (!Array.isArray(alimentosRaw)) {
        logging.error('Invalid alimentos array in API response:', {
          url,
          dataType: typeof alimentosRaw,
        })
        span.setAttribute('response.invalid', true)
        return []
      }
      
      const result = parseWithStack(apiFoodSchema.array(), alimentosRaw)
      span.setAttribute('food.result.count', result.length)
      return result
    },
    {
      'external.api.type': 'food_database',
    },
  )
}

async function fetchApiFoodByEan(
  ean: Required<ApiFood>['ean'],
): Promise<ApiFood> {
  const url = `${EXTERNAL_API_BASE_URL}/${EXTERNAL_API_EAN_ENDPOINT}/${ean}`
  
  return await traceHttpRequest(
    'GET',
    url,
    async (span) => {
      span.setAttribute('external.api', 'food_database')
      span.setAttribute('external.api.operation', 'lookup_by_ean')
      span.setAttribute('food.ean', ean)

      const response = await API.get(url, {
        headers: {
          accept: 'application/json, text/plain, */*',
          'accept-encoding': 'gzip',
          'app-token': 'wapstore',
          authorization: EXTERNAL_API_AUTHORIZATION,
          connection: 'Keep-Alive',
          host: EXTERNAL_API_HOST,
          referer: EXTERNAL_API_REFERER,
          'user-agent': 'okhttp/4.9.2',
        },
      })

      span.setAttribute('http.status_code', response.status)
      logging.debug('response=', { response })
      return parseWithStack(apiFoodSchema, response.data)
    },
    {
      'external.api.type': 'ean_scanner',
    },
  )
}

