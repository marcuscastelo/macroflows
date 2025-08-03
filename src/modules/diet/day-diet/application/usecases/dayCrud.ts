import {
  type DayDiet,
  type NewDayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { dayCacheStore } from '~/modules/diet/day-diet/infrastructure/signals/dayCacheStore'
import { createSupabaseDayRepository } from '~/modules/diet/day-diet/infrastructure/supabase/supabaseDayRepository'
import { showPromise } from '~/modules/toast/application/toastManager'
import { type User } from '~/modules/user/domain/user'
import { createErrorHandler } from '~/shared/error/errorHandler'

const dayRepository = createSupabaseDayRepository()
const errorHandler = createErrorHandler('application', 'DayDiet')

/**
 * Fetches only the current target day
 * Updates local cache intelligently without full refetch
 * @param userId - User ID
 * @param targetDay - Target day to fetch
 * @param existingDays - Current cached days (passed to avoid reactive reads in async context)
 */
export async function fetchCurrentDayDiet(
  userId: User['id'],
  targetDay: string,
): Promise<void> {
  try {
    const currentDayDiet = await dayRepository.fetchCurrentUserDayDiet(
      userId,
      targetDay,
    )

    if (currentDayDiet === null) {
      dayCacheStore.removeFromCache({ by: 'target_day', value: targetDay })
      return
    }
    dayCacheStore.upsertToCache(currentDayDiet)
  } catch (error) {
    errorHandler.error(error)
    dayCacheStore.removeFromCache({ by: 'target_day', value: targetDay })
  }
}

/**
 * Fetches previous days for copy functionality
 * Only fetches when needed instead of requiring all days to be cached
 */
export async function fetchPreviousDayDiets(
  userId: User['id'],
  beforeDay: string,
  limit: number = 30,
): Promise<readonly DayDiet[]> {
  try {
    return await dayRepository.fetchPreviousUserDayDiets(
      userId,
      beforeDay,
      limit,
    )
  } catch (error) {
    errorHandler.error(error)
    return []
  }
}

/**
 * Inserts a new day diet.
 * @param dayDiet - The new day diet data.
 * @returns True if inserted, false otherwise.
 */
export async function insertDayDiet(dayDiet: NewDayDiet): Promise<boolean> {
  try {
    const insertedDayDiet = await showPromise(
      dayRepository.insertDayDiet(dayDiet),
      {
        loading: 'Criando dia de dieta...',
        success: 'Dia de dieta criado com sucesso',
        error: 'Erro ao criar dia de dieta',
      },
      { context: 'user-action', audience: 'user' },
    )

    if (insertedDayDiet !== null) {
      dayCacheStore.upsertToCache(insertedDayDiet)
    }

    return true
  } catch (error) {
    errorHandler.error(error)
    return false
  }
}

/**
 * Updates a day diet by ID.
 * @param dayId - The day diet ID.
 * @param dayDiet - The new day diet data.
 * @returns True if updated, false otherwise.
 */
export async function updateDayDiet(
  dayId: DayDiet['id'],
  dayDiet: NewDayDiet,
): Promise<boolean> {
  try {
    const updatedDayDiet = await showPromise(
      dayRepository.updateDayDiet(dayId, dayDiet),
      {
        loading: 'Atualizando dieta...',
        success: 'Dieta atualizada com sucesso',
        error: 'Erro ao atualizar dieta',
      },
      { context: 'user-action', audience: 'user' },
    )

    dayCacheStore.upsertToCache(updatedDayDiet)
    return true
  } catch (error) {
    errorHandler.error(error)
    return false
  }
}

/**
 * Deletes a day diet by ID.
 * @param dayId - The day diet ID.
 * @returns True if deleted, false otherwise.
 */
export async function deleteDayDiet(dayId: DayDiet['id']): Promise<boolean> {
  try {
    // Store target day for potential currentDayDiet cleanup before deletion
    await showPromise(
      dayRepository.deleteDayDiet(dayId),
      {
        loading: 'Deletando dieta...',
        success: 'Dieta deletada com sucesso',
        error: 'Erro ao deletar dieta',
      },
      { context: 'user-action', audience: 'user' },
    )

    dayCacheStore.removeFromCache({ by: 'id', value: dayId })

    return true
  } catch (error) {
    errorHandler.error(error)
    return false
  }
}
