import { createEffect, createSignal, onCleanup } from 'solid-js'

import {
  type DayDiet,
  type NewDayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import {
  createSupabaseDayRepository,
  setupDayDietRealtimeSubscription,
} from '~/modules/diet/day-diet/infrastructure/supabaseDayRepository'
import { showPromise } from '~/modules/toast/application/toastManager'
import { currentUserId } from '~/modules/user/application/user'
import { type User } from '~/modules/user/domain/user'
import { createErrorHandler } from '~/shared/error/errorHandler'
import { getTodayYYYYMMDD } from '~/shared/utils/date/dateUtils'

const dayRepository = createSupabaseDayRepository()
const errorHandler = createErrorHandler('application', 'DayDiet')

export const [targetDay, setTargetDay] =
  createSignal<string>(getTodayYYYYMMDD())

const [dayDiets, setDayDiets] = createSignal<readonly DayDiet[]>([])

export const [currentDayDiet, setCurrentDayDiet] = createSignal<DayDiet | null>(
  null,
)

/**
 * Reactive signal that tracks the current day and automatically updates when the day changes.
 * This is used for day lock functionality to ensure proper edit mode restrictions.
 */
export const [currentToday, setCurrentToday] =
  createSignal<string>(getTodayYYYYMMDD())

/**
 * Signal that tracks when the day has changed and a confirmation modal should be shown.
 * Contains the previous day that the user was viewing when the day changed.
 */
export const [dayChangeData, setDayChangeData] = createSignal<{
  previousDay: string
  newDay: string
} | null>(null)

// Set up automatic day change detection
let dayCheckInterval: NodeJS.Timeout | null = null

function startDayChangeDetection() {
  // Clear any existing interval
  if (dayCheckInterval !== null) {
    clearInterval(dayCheckInterval)
  }

  dayCheckInterval = setInterval(() => {
    const newToday = getTodayYYYYMMDD()
    const previousToday = currentToday()

    if (newToday !== previousToday) {
      console.log(`[dayDiet] Day changed from ${previousToday} to ${newToday}`)
      setCurrentToday(newToday)

      // Only show modal if user is not already viewing today
      if (targetDay() !== newToday) {
        setDayChangeData({
          previousDay: previousToday,
          newDay: newToday,
        })
      }
    }
  }, 6000)
}

createEffect(() => {
  // Start day change detection immediately
  startDayChangeDetection()
  // Cleanup interval on module cleanup
  onCleanup(() => {
    if (dayCheckInterval !== null) {
      clearInterval(dayCheckInterval)
      dayCheckInterval = null
    }
  })
})

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
    setTargetDay(changeData.newDay)
    setDayChangeData(null)
    // No need to refetch - lazy loading effect will handle target day change
  }
}

// Bootstrap removed - using pure lazy loading now

/**
 * Optimized: Fetches only the current target day
 * Updates local cache intelligently without full refetch
 */
/**
 * Optimized: Fetches only the current target day
 * Updates local cache intelligently without full refetch
 * @param userId - User ID
 * @param targetDay - Target day to fetch
 * @param existingDays - Current cached days (passed to avoid reactive reads in async context)
 */
async function fetchCurrentDayDiet(
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
 * Optimized: Fetches previous days for copy functionality
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
 * When user changes, clear cache to force lazy loading for new user
 */
createEffect(() => {
  // Clear cache when user changes - lazy loading will handle refetch
  setDayDiets([])
  setCurrentDayDiet(null)
})

/**
 * When realtime day diets change, invalidate cache for granular updates
 */
setupDayDietRealtimeSubscription(() => {
  // Clear cache to force fresh lazy loading on next access
  setDayDiets([])
  // Keep current day diet to maintain UI state until user navigates
})

/**
 * When target day changes, update current day diet
 * Optimized: Fetches specific day if not in cache
 */
createEffect(() => {
  const currentTarget = targetDay()
  const existingDays = dayDiets()
  const dayDiet = existingDays.find(
    (dayDiet) => dayDiet.target_day === currentTarget,
  )

  if (dayDiet === undefined) {
    console.warn(
      `[dayDiet] No day diet found for ${currentTarget}, fetching...`,
    )
    setCurrentDayDiet(null)

    // Optimized: Fetch only the specific day we need
    void fetchCurrentDayDiet(currentUserId(), currentTarget, existingDays)
    return
  }

  setCurrentDayDiet(dayDiet)
})

// fetchAllUserDayDiets removed - using pure lazy loading now

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

/**
 * Returns all previous DayDiet objects before the given target day, ordered by descending date.
 *
 * @param dayDiets - List of all DayDiet objects (should be sorted ascending by date)
 * @param selectedDay - The YYYY-MM-DD string to compare against
 * @returns Array of DayDiet objects before selectedDay, ordered by descending date
 */
export function getPreviousDayDiets(
  dayDiets: readonly DayDiet[],
  selectedDay: string,
): DayDiet[] {
  const selectedDate = new Date(selectedDay)
  selectedDate.setHours(0, 0, 0, 0) // Normalize to midnight to avoid time zone issues

  return dayDiets
    .filter((day) => {
      const dayDate = new Date(day.target_day)
      dayDate.setHours(0, 0, 0, 0) // Normalize to midnight
      return dayDate.getTime() < selectedDate.getTime()
    })
    .sort((a, b) => {
      const dateA = new Date(a.target_day)
      const dateB = new Date(b.target_day)
      return dateB.getTime() - dateA.getTime()
    })
}
