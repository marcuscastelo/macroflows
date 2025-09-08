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
import {
  createErrorHandler,
  wrapErrorWithStack,
} from '~/shared/error/errorHandler'
import { jsonParseWithStack } from '~/shared/utils/jsonParseWithStack'
import { logging } from '~/shared/utils/logging'
import { parseWithStack } from '~/shared/utils/parseWithStack'

const API = rateLimit(axios.create(), {
  maxRequests: 2,
  perMilliseconds: 1000,
  maxRPS: 2,
})

const errorHandler = createErrorHandler('infrastructure', 'Food')

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

  let parsedParams: unknown
  try {
    parsedParams = jsonParseWithStack(EXTERNAL_API_FOOD_PARAMS)
  } catch (err) {
    errorHandler.error(err)
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
  } catch (error) {
    errorHandler.error(error)
    throw wrapErrorWithStack(error)
  }

  logging.debug(`[ApiFood] Response from url ${url}`, { response })

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const data = response.data
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const alimentosRaw = data.alimentos
  if (!Array.isArray(alimentosRaw)) {
    errorHandler.error(new Error('Invalid alimentos array in API response'), {
      additionalData: { url, dataType: typeof alimentosRaw },
    })
    return []
  }
  return parseWithStack(apiFoodSchema.array(), alimentosRaw)
}

async function fetchApiFoodByEan(
  ean: Required<ApiFood>['ean'],
): Promise<ApiFood> {
  const url = `${EXTERNAL_API_BASE_URL}/${EXTERNAL_API_EAN_ENDPOINT}/${ean}`
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

  logging.debug('response=', { response })
  return parseWithStack(apiFoodSchema, response.data)
}
