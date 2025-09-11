import {
  type DayDiet,
  dayDietSchema,
  type NewDayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { type DayGateway } from '~/modules/diet/day-diet/domain/dayDietGateway'
import { SUPABASE_TABLE_DAYS } from '~/modules/diet/day-diet/infrastructure/supabase/constants'
import { supabaseDayMapper } from '~/modules/diet/day-diet/infrastructure/supabase/supabaseMapper'
import { type User } from '~/modules/user/domain/user'
import { wrapErrorWithStack } from '~/shared/error/errorHandler'
import { supabase } from '~/shared/supabase/supabase'
import { logging } from '~/shared/utils/logging'

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
      logging.error('DayDiet fetch error:', error)
      throw error
    }

    const dayDiets = Array.isArray(data) ? data : []
    if (dayDiets.length === 0) {
      logging.error('DayDiet not found:', { dayId })
      throw new Error('DayDiet not found')
    }
    const result = dayDietSchema.safeParse(dayDiets[0])
    if (!result.success) {
      logging.error('DayDiet invalid:', { dayId, parseError: result.error })
      throw new Error('DayDiet invalid')
    }
    return result.data
  } catch (err) {
    logging.error('DayDiet fetch error:', err)
    throw err
  }
}

async function fetchDayDietByUserIdAndTargetDay(
  userId: User['id'],
  targetDay: string,
): Promise<DayDiet | null> {
  logging.debug(
    `[supabaseDayRepository] fetchCurrentUserDayDiet(${userId}, ${targetDay})`,
  )

  const { data, error } = await supabase
    .from(SUPABASE_TABLE_DAYS)
    .select()
    .eq('owner', userId)
    .eq('target_day', targetDay)
    .single()

  if (error !== null) {
    if (error.code === 'PGRST116') {
      // No rows returned - day doesn't exist
      logging.debug(`[supabaseDayRepository] No day found for ${targetDay}`)
      return null
    }
    logging.error('DayDiet fetch error:', error)
    throw error
  }

  const dayData = data
  const result = dayDietSchema.safeParse(dayData)
  if (!result.success) {
    logging.error('Error parsing current day diet:', {
      parseError: result.error,
      targetDay,
    })
    throw wrapErrorWithStack(result.error)
  }

  logging.debug(`[supabaseDayRepository] Successfully fetched day ${targetDay}`)
  return result.data
}

async function fetchDayDietsByUserIdBeforeDate(
  userId: User['id'],
  beforeDay: string,
  limit: number = 30,
): Promise<readonly DayDiet[]> {
  logging.debug(
    `[supabaseDayRepository] fetchPreviousUserDayDiets(${userId}, ${beforeDay}, ${limit})`,
  )

  const { data: dayDTOs, error } = await supabase
    .from(SUPABASE_TABLE_DAYS)
    .select()
    .eq('owner', userId)
    .lt('target_day', beforeDay)
    .order('target_day', { ascending: false })
    .limit(limit)

  if (error !== null) {
    logging.error('DayDiet fetch error:', error)
    throw error
  }

  return dayDTOs.map((dto) => supabaseDayMapper.toDomain(dto))
}

async function insertDayDiet(newDay: NewDayDiet): Promise<DayDiet | null> {
  const newDayDTO = supabaseDayMapper.toInsertDTO(newDay)

  const { data: dayDTO, error } = await supabase
    .from(SUPABASE_TABLE_DAYS)
    .insert(newDayDTO)
    .select()
    .single()
  if (error !== null) {
    throw wrapErrorWithStack(error)
  }

  return supabaseDayMapper.toDomain(dayDTO)
}

async function updateDayDietById(
  id: DayDiet['id'],
  newDay: NewDayDiet,
): Promise<DayDiet> {
  const updateDTO = supabaseDayMapper.toInsertDTO(newDay)

  const { data: dayDTO, error } = await supabase
    .from(SUPABASE_TABLE_DAYS)
    .update(updateDTO)
    .eq('id', id)
    .select()
    .single()

  if (error !== null) {
    logging.error('DayDiet update error:', error)
    throw error
  }

  return supabaseDayMapper.toDomain(dayDTO)
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
