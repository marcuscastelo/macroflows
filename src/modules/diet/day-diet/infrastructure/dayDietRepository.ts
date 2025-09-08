import {
  type DayDiet,
  type NewDayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { type DayRepository } from '~/modules/diet/day-diet/domain/dayDietRepository'
import { dayCacheStore } from '~/modules/diet/day-diet/infrastructure/signals/dayCacheStore'
import { createSupabaseDayGateway } from '~/modules/diet/day-diet/infrastructure/supabase/supabaseDayGateway'
import { type User } from '~/modules/user/domain/user'
import { createErrorHandler } from '~/shared/error/errorHandler'
import { withDatabaseSpan } from '~/shared/utils/tracing'

const supabaseGateway = createSupabaseDayGateway()
const errorHandler = createErrorHandler('application', 'DayDiet')

export function createDayDietRepository(): DayRepository {
  return {
    fetchDayDietById,
    fetchDayDietByUserIdAndTargetDay,
    fetchDayDietsByUserIdBeforeDate,
    insertDayDiet,
    updateDayDietById,
    deleteDayDietById,
  }
}

export async function fetchDayDietById(
  dayId: DayDiet['id'],
): Promise<DayDiet | null> {
  return await withDatabaseSpan('SELECT', 'day_diet', async (span) => {
    span.setAttributes({
      'day_diet.id': dayId,
      'operation.type': 'fetch_by_id',
    })

    try {
      const dayDiet = await supabaseGateway.fetchDayDietById(dayId)
      if (dayDiet === null) {
        span.addEvent('day_diet_not_found', { dayId })
        dayCacheStore.removeFromCache({ by: 'id', value: dayId })
        return null
      }

      span.addEvent('day_diet_found', {
        dayId,
        hasMeals: dayDiet.meals.length > 0,
      })
      dayCacheStore.upsertToCache(dayDiet)
      return dayDiet
    } catch (error) {
      span.addEvent('day_diet_fetch_error', { dayId, error: String(error) })
      errorHandler.error(error)
      dayCacheStore.removeFromCache({ by: 'id', value: dayId })
      return null
    }
  })
}

export async function fetchDayDietByUserIdAndTargetDay(
  userId: User['id'],
  targetDay: string,
): Promise<DayDiet | null> {
  try {
    const currentDayDiet =
      await supabaseGateway.fetchDayDietByUserIdAndTargetDay(userId, targetDay)

    if (currentDayDiet === null) {
      dayCacheStore.removeFromCache({ by: 'target_day', value: targetDay })
      return null
    }
    dayCacheStore.upsertToCache(currentDayDiet)
    return currentDayDiet
  } catch (error) {
    errorHandler.error(error)
    dayCacheStore.removeFromCache({ by: 'target_day', value: targetDay })
    return null
  }
}

export async function fetchDayDietsByUserIdBeforeDate(
  userId: User['id'],
  beforeDay: string,
  limit: number = 30,
): Promise<readonly DayDiet[]> {
  try {
    const previousDays = await supabaseGateway.fetchDayDietsByUserIdBeforeDate(
      userId,
      beforeDay,
      limit,
    )
    for (const day of previousDays) {
      dayCacheStore.upsertToCache(day)
    }
    return previousDays
  } catch (error) {
    errorHandler.error(error)
    return []
  }
}

export async function insertDayDiet(
  dayDiet: NewDayDiet,
): Promise<DayDiet | null> {
  return await withDatabaseSpan('INSERT', 'day_diet', async (span) => {
    span.setAttributes({
      'day_diet.user_id': dayDiet.owner,
      'day_diet.target_day': dayDiet.target_day,
      'operation.type': 'insert_new',
    })

    try {
      const insertedDayDiet = await supabaseGateway.insertDayDiet(dayDiet)
      if (insertedDayDiet !== null) {
        span.addEvent('day_diet_inserted', {
          dayId: insertedDayDiet.id,
          mealsCount: insertedDayDiet.meals.length,
        })
        dayCacheStore.upsertToCache(insertedDayDiet)
      } else {
        span.addEvent('day_diet_insert_failed')
      }
      return insertedDayDiet
    } catch (error) {
      span.addEvent('day_diet_insert_error', { error: String(error) })
      errorHandler.error(error)
      return null
    }
  })
}

export async function updateDayDietById(
  dayId: DayDiet['id'],
  dayDiet: NewDayDiet,
): Promise<DayDiet | null> {
  return await withDatabaseSpan('UPDATE', 'day_diet', async (span) => {
    span.setAttributes({
      'day_diet.id': dayId,
      'day_diet.user_id': dayDiet.owner,
      'day_diet.target_day': dayDiet.target_day,
      'operation.type': 'update_by_id',
    })

    try {
      const updatedDayDiet = await supabaseGateway.updateDayDietById(
        dayId,
        dayDiet,
      )

      if (updatedDayDiet !== null) {
        span.addEvent('day_diet_updated', {
          dayId: updatedDayDiet.id,
          mealsCount: updatedDayDiet.meals.length,
        })
        dayCacheStore.upsertToCache(updatedDayDiet)
      } else {
        span.addEvent('day_diet_update_failed', { dayId })
      }
      return updatedDayDiet
    } catch (error) {
      span.addEvent('day_diet_update_error', { dayId, error: String(error) })
      errorHandler.error(error)
      return null
    }
  })
}

export async function deleteDayDietById(dayId: DayDiet['id']): Promise<void> {
  try {
    await supabaseGateway.deleteDayDietById(dayId)
    dayCacheStore.removeFromCache({ by: 'id', value: dayId })
  } catch (error) {
    errorHandler.error(error)
  }
}
