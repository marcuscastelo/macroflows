import { untrack } from 'solid-js'

import {
  dayChangeData,
  dayDiets,
  setCurrentDayDiet,
  setDayChangeData,
  setDayDiets,
  setTargetDay,
  targetDay,
} from '~/modules/diet/day-diet/application/dayDietStore'
import {
  type DayDiet,
  type NewDayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import {
  createSupabaseDayRepository,
  setupDayDietRealtimeSubscription,
} from '~/modules/diet/day-diet/infrastructure/supabaseDayRepository'
import { showPromise } from '~/modules/toast/application/toastManager'
import { type User } from '~/modules/user/domain/user'
import { createErrorHandler } from '~/shared/error/errorHandler'

const dayRepository = createSupabaseDayRepository()
const errorHandler = createErrorHandler('application', 'DayDiet')

/**
 * Dismisses the day change confirmation modal
 */
export function dismissDayChangeModal() {
  setDayChangeData(null)
}

/**
 * Accepts the day change and navigates to the new day
 */
export function acceptDayChange() {
  const changeData = dayChangeData()
  if (changeData) {
    setDayDiets([])
    setTargetDay(changeData.newDay)
    setDayChangeData(null)
  }
}

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
  existingDays: readonly DayDiet[],
): Promise<void> {
  try {
    const currentDayDiet = await dayRepository.fetchCurrentUserDayDiet(
      userId,
      targetDay,
    )

    if (currentDayDiet === null) {
      // Day doesn't exist - create minimal cache entry
      setCurrentDayDiet(null)
      // Keep existing dayDiets cache, just ensure currentDayDiet is null
      return
    }

    // Update cache efficiently
    const existingDayIndex = existingDays.findIndex(
      (day) => day.target_day === targetDay,
    )

    if (existingDayIndex >= 0) {
      // Update existing day in cache
      const updatedDays = [...existingDays]
      updatedDays[existingDayIndex] = currentDayDiet
      setDayDiets(updatedDays)
    } else {
      // Add new day to cache (sorted insertion)
      const updatedDays = [...existingDays, currentDayDiet].sort((a, b) =>
        a.target_day.localeCompare(b.target_day),
      )
      setDayDiets(updatedDays)
    }

    setCurrentDayDiet(currentDayDiet)
  } catch (error) {
    errorHandler.error(error)
    setCurrentDayDiet(null)
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
 * When realtime day diets change, apply granular cache updates
 */
setupDayDietRealtimeSubscription((event) => {
  console.log(`[dayDiet] Real-time ${event.eventType}:`, event)

  // Avoid reactive reads in non-tracked scope - get current state directly
  const existingDays = untrack(() => dayDiets())

  switch (event.eventType) {
    case 'INSERT': {
      if (event.new) {
        // Add new day to cache (sorted insertion)
        const existingIndex = existingDays.findIndex(
          (day: DayDiet) => day.target_day === event.new!.target_day,
        )
        if (existingIndex < 0) {
          const updatedDays = [...existingDays, event.new].sort((a, b) =>
            a.target_day.localeCompare(b.target_day),
          )
          setDayDiets(updatedDays)
        }

        // Update current day diet if it matches target day
        const currentTargetDay = untrack(() => targetDay())
        if (event.new.target_day === currentTargetDay) {
          setCurrentDayDiet(event.new)
        }
      }
      break
    }

    case 'UPDATE': {
      if (event.new) {
        // Update existing day in cache
        const existingIndex = existingDays.findIndex(
          (day: DayDiet) => day.id === event.new!.id,
        )
        if (existingIndex >= 0) {
          const updatedDays = [...existingDays]
          updatedDays[existingIndex] = event.new
          setDayDiets(updatedDays)

          // Update current day diet if it matches target day
          const currentTargetDay = untrack(() => targetDay())
          if (event.new.target_day === currentTargetDay) {
            setCurrentDayDiet(event.new)
          }
        }
      }
      break
    }

    case 'DELETE': {
      if (event.old) {
        // Remove deleted day from cache
        const updatedDays = existingDays.filter(
          (day: DayDiet) => day.id !== event.old!.id,
        )
        setDayDiets(updatedDays)

        // Clear current day diet if it was the deleted day
        const currentTargetDay = untrack(() => targetDay())
        if (event.old.target_day === currentTargetDay) {
          setCurrentDayDiet(null)
          // Lazy loading effect will handle fetching if day still exists
        }
      }
      break
    }
  }
})

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

    // Optimistic cache update - add new day diet to cache
    if (insertedDayDiet) {
      const existingDays = dayDiets()
      const existingIndex = existingDays.findIndex(
        (day) => day.target_day === insertedDayDiet.target_day,
      )

      if (existingIndex >= 0) {
        // Replace existing day
        const updatedDays = [...existingDays]
        updatedDays[existingIndex] = insertedDayDiet
        setDayDiets(updatedDays)
      } else {
        // Add new day (sorted insertion)
        const updatedDays = [...existingDays, insertedDayDiet].sort((a, b) =>
          a.target_day.localeCompare(b.target_day),
        )
        setDayDiets(updatedDays)
      }

      // Update current day diet if it matches target day
      if (insertedDayDiet.target_day === targetDay()) {
        setCurrentDayDiet(insertedDayDiet)
      }
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

    // Optimistic cache update - update existing day diet in cache
    const existingDays = dayDiets()
    const existingIndex = existingDays.findIndex((day) => day.id === dayId)

    if (existingIndex >= 0) {
      // Update existing day in cache
      const updatedDays = [...existingDays]
      updatedDays[existingIndex] = updatedDayDiet
      setDayDiets(updatedDays)

      // Update current day diet if it matches the updated day
      if (updatedDayDiet.target_day === targetDay()) {
        setCurrentDayDiet(updatedDayDiet)
      }
    }
    // If day not in cache, lazy loading will handle it when needed

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
    const existingDays = dayDiets()
    const dayToDelete = existingDays.find((day) => day.id === dayId)

    await showPromise(
      dayRepository.deleteDayDiet(dayId),
      {
        loading: 'Deletando dieta...',
        success: 'Dieta deletada com sucesso',
        error: 'Erro ao deletar dieta',
      },
      { context: 'user-action', audience: 'user' },
    )

    // Optimistic cache update - remove deleted day from cache
    const updatedDays = existingDays.filter((day) => day.id !== dayId)
    setDayDiets(updatedDays)

    // Clear current day diet if it was the deleted day
    if (dayToDelete && dayToDelete.target_day === targetDay()) {
      setCurrentDayDiet(null)
      // Lazy loading effect will handle fetching if day still exists after deletion
    }

    return true
  } catch (error) {
    errorHandler.error(error)
    return false
  }
}
