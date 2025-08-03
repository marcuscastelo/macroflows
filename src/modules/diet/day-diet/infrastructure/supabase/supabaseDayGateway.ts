import {
  type DayDiet,
  dayDietSchema,
  type NewDayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { type DayGateway } from '~/modules/diet/day-diet/domain/dayDietGateway'
import {
  createDayDietDAOFromNewDayDiet,
  daoToDayDiet,
} from '~/modules/diet/day-diet/infrastructure/dayDietDAO'
import { type User } from '~/modules/user/domain/user'
import {
  createErrorHandler,
  wrapErrorWithStack,
} from '~/shared/error/errorHandler'
import { supabase } from '~/shared/utils/supabase'

export const SUPABASE_TABLE_DAYS = 'days'

const errorHandler = createErrorHandler('infrastructure', 'DayDiet')

export function createSupabaseDayGateway(): DayGateway {
  return {
    fetchDayDietByUserIdAndTargetDay,
    fetchDayDietsByUserIdBeforeDate,
    fetchDayDietById,
    insertDayDiet,
    updateDayDietById,
    deleteDayDietById,
  }
}

async function fetchDayDietById(dayId: DayDiet['id']): Promise<DayDiet> {
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

async function fetchDayDietByUserIdAndTargetDay(
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

async function fetchDayDietsByUserIdBeforeDate(
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

const updateDayDietById = async (
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

const deleteDayDietById = async (id: DayDiet['id']): Promise<void> => {
  const { error } = await supabase
    .from(SUPABASE_TABLE_DAYS)
    .delete()
    .eq('id', id)
    .select()

  if (error !== null) {
    throw wrapErrorWithStack(error)
  }
}
