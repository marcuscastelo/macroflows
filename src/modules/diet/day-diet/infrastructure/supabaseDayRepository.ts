import { type Accessor, createSignal } from 'solid-js'

import {
  type DayDiet,
  dayDietSchema,
  type NewDayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { type DayRepository } from '~/modules/diet/day-diet/domain/dayDietRepository'
import {
  createDayDietDAOFromNewDayDiet,
  daoToDayDiet,
} from '~/modules/diet/day-diet/infrastructure/dayDietDAO'
import { type User } from '~/modules/user/domain/user'
import {
  createErrorHandler,
  wrapErrorWithStack,
} from '~/shared/error/errorHandler'
import {
  registerSubapabaseRealtimeCallback,
  supabase,
} from '~/shared/utils/supabase'

export const SUPABASE_TABLE_DAYS = 'days'

const errorHandler = createErrorHandler('infrastructure', 'DayDiet')

export function createSupabaseDayRepository(): DayRepository {
  return {
    // New optimized methods
    fetchCurrentUserDayDiet,
    fetchPreviousUserDayDiets,

    // Legacy method - maintained for compatibility
    fetchAllUserDayDiets,

    // Existing methods
    fetchDayDiet,
    insertDayDiet,
    updateDayDiet,
    deleteDayDiet,
  }
}

/**
 * Sets up realtime subscription for day diet changes
 * @param onDayDietsChange - Callback function to call when data changes
 */
export function setupDayDietRealtimeSubscription(
  onDayDietsChange: () => void,
): void {
  registerSubapabaseRealtimeCallback(SUPABASE_TABLE_DAYS, onDayDietsChange)
}

/**
 * // TODO:   Replace userDays with userDayIndexes
 * @deprecated should be replaced by userDayIndexes
 */
const [userDays, setUserDays] = createSignal<readonly DayDiet[]>([])
// const [userDayIndexes, setUserDayIndexes] = createSignal<readonly DayIndex[]>([])

// TODO:   better error handling
/**
 * Fetches a DayDiet by its ID.
 * Throws on error or if not found.
 * @param dayId - The DayDiet ID
 * @returns The DayDiet
 * @throws Error if not found or on API/validation error
 */
async function fetchDayDiet(dayId: DayDiet['id']): Promise<DayDiet> {
  try {
    const { data, error } = await supabase
      .from(SUPABASE_TABLE_DAYS)
      .select()
      .eq('id', dayId)

    if (error !== null) {
      errorHandler.error(error)
      throw error
    }

    const dayDiets = Array.isArray(data) ? data : []
    if (dayDiets.length === 0) {
      errorHandler.validationError('DayDiet not found', {
        component: 'supabaseDayRepository',
        operation: 'fetchDayDiet',
        additionalData: { dayId },
      })
      throw new Error('DayDiet not found')
    }
    const result = dayDietSchema.safeParse(dayDiets[0])
    if (!result.success) {
      errorHandler.validationError('DayDiet invalid', {
        component: 'supabaseDayRepository',
        operation: 'fetchDayDiet',
        additionalData: { dayId, parseError: result.error },
      })
      throw new Error('DayDiet invalid')
    }
    return result.data
  } catch (err) {
    errorHandler.error(err)
    throw err
  }
}

// TODO:   better error handling
async function fetchAllUserDayDiets(
  userId: User['id'],
): Promise<Accessor<readonly DayDiet[]>> {
  console.debug(`[supabaseDayRepository] fetchUserDays(${userId})`)
  const { data, error } = await supabase
    .from(SUPABASE_TABLE_DAYS)
    .select()
    .eq('owner', userId)
    .order('target_day', { ascending: true })

  if (error !== null) {
    errorHandler.error(error)
    throw error
  }

  const days = data
    .map((day) => {
      return dayDietSchema.safeParse(day)
    })
    .map((result) => {
      if (result.success) {
        return result.data
      }
      errorHandler.validationError('Error while parsing day', {
        component: 'supabaseDayRepository',
        operation: 'fetchAllUserDayDiets',
        additionalData: { parseError: result.error },
      })
      throw wrapErrorWithStack(result.error)
    })

  console.log('days', days)

  console.debug(
    `[supabaseDayRepository] fetchUserDays returned ${days.length} days`,
  )
  setUserDays(days)

  return userDays
}

/**
 * Optimized: Fetches only the current day diet for a user
 * @param userId - User ID
 * @param targetDay - Target day in YYYY-MM-DD format
 * @returns The DayDiet for the target day or null if not found
 */
async function fetchCurrentUserDayDiet(
  userId: User['id'],
  targetDay: string,
): Promise<DayDiet | null> {
  console.debug(
    `[supabaseDayRepository] fetchCurrentUserDayDiet(${userId}, ${targetDay})`,
  )

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { data, error } = await supabase
    .from(SUPABASE_TABLE_DAYS)
    .select()
    .eq('owner', userId)
    .eq('target_day', targetDay)
    .single()

  if (error !== null) {
    if (error.code === 'PGRST116') {
      // No rows returned - day doesn't exist
      console.debug(`[supabaseDayRepository] No day found for ${targetDay}`)
      return null
    }
    errorHandler.error(error)
    throw error
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const dayData = data
  const result = dayDietSchema.safeParse(dayData)
  if (!result.success) {
    errorHandler.validationError('Error parsing current day diet', {
      component: 'supabaseDayRepository',
      operation: 'fetchCurrentUserDayDiet',
      additionalData: { parseError: result.error, targetDay },
    })
    throw wrapErrorWithStack(result.error)
  }

  console.debug(`[supabaseDayRepository] Successfully fetched day ${targetDay}`)
  return result.data
}

/**
 * Optimized: Fetches previous days for a user (for copy functionality)
 * @param userId - User ID
 * @param beforeDay - Only fetch days before this date (YYYY-MM-DD)
 * @param limit - Maximum number of days to fetch (default: 30)
 * @returns Array of previous DayDiets ordered by date descending
 */
async function fetchPreviousUserDayDiets(
  userId: User['id'],
  beforeDay: string,
  limit: number = 30,
): Promise<readonly DayDiet[]> {
  console.debug(
    `[supabaseDayRepository] fetchPreviousUserDayDiets(${userId}, ${beforeDay}, ${limit})`,
  )

  const { data, error } = await supabase
    .from(SUPABASE_TABLE_DAYS)
    .select()
    .eq('owner', userId)
    .lt('target_day', beforeDay)
    .order('target_day', { ascending: false })
    .limit(limit)

  if (error !== null) {
    errorHandler.error(error)
    throw error
  }

  const days = data
    .map((day) => {
      return dayDietSchema.safeParse(day)
    })
    .map((result) => {
      if (result.success) {
        return result.data
      }
      errorHandler.validationError('Error parsing previous day diet', {
        component: 'supabaseDayRepository',
        operation: 'fetchPreviousUserDayDiets',
        additionalData: { parseError: result.error },
      })
      throw wrapErrorWithStack(result.error)
    })

  console.debug(
    `[supabaseDayRepository] fetchPreviousUserDayDiets returned ${days.length} days`,
  )
  return days
}

// TODO:   Change upserts to inserts on the entire app
const insertDayDiet = async (newDay: NewDayDiet): Promise<DayDiet | null> => {
  // Use direct UnifiedItem persistence (no migration needed)
  const createDAO = createDayDietDAOFromNewDayDiet(newDay)

  const { data: days, error } = await supabase
    .from(SUPABASE_TABLE_DAYS)
    .insert(createDAO)
    .select()
  if (error !== null) {
    throw wrapErrorWithStack(error)
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const dayDAO = days[0]
  if (dayDAO !== undefined) {
    // Data is already in unified format, no migration needed for new inserts
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return daoToDayDiet(dayDAO)
  }
  return null
}

const updateDayDiet = async (
  id: DayDiet['id'],
  newDay: NewDayDiet,
): Promise<DayDiet> => {
  // Use direct UnifiedItem persistence (no migration needed)
  const updateDAO = createDayDietDAOFromNewDayDiet(newDay)

  const { data, error } = await supabase
    .from(SUPABASE_TABLE_DAYS)
    .update(updateDAO)
    .eq('id', id)
    .select()

  if (error !== null) {
    errorHandler.error(error)
    throw error
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const dayDAO = data[0]
  // Data is already in unified format, no migration needed for updates
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return daoToDayDiet(dayDAO)
}

const deleteDayDiet = async (id: DayDiet['id']): Promise<void> => {
  const { error } = await supabase
    .from(SUPABASE_TABLE_DAYS)
    .delete()
    .eq('id', id)
    .select()

  if (error !== null) {
    throw wrapErrorWithStack(error)
  }

  const userId = userDays().find((day) => day.id === id)?.owner
  if (userId === undefined) {
    throw new Error(
      `Invalid state: userId not found for day ${id} on local cache`,
    )
  }
}
