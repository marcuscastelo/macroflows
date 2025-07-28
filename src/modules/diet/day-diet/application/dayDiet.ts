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

export const [dayDiets, setDayDiets] = createSignal<readonly DayDiet[]>([])

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
    bootstrap() // Refetch day diets to ensure current day is available
  }
}

function bootstrap() {
  // For backward compatibility and non-reactive contexts, fetch all days
  // This ensures realtime updates and user changes still work properly
  void showPromise(
    fetchAllUserDayDiets(currentUserId()),
    {
      loading: 'Carregando dietas do usuário...',
      success: 'Dietas do usuário obtidas com sucesso',
      error: 'Erro ao obter dietas do usuário',
    },
    { context: 'background' },
  )
}

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
 * When user changes, fetch all day diets for the new user
 */
createEffect(() => {
  bootstrap()
})

/**
 * When realtime day diets change, update day diets for current user
 */
setupDayDietRealtimeSubscription(() => {
  bootstrap()
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

/**
 * Legacy: Fetches all user days (used for special cases like copy modal)
 * Most common usage should use fetchCurrentDayDiet() instead
 */
async function fetchAllUserDayDiets(userId: User['id']): Promise<void> {
  try {
    const newDayDiets = await dayRepository.fetchAllUserDayDiets(userId)
    setDayDiets(newDayDiets)
  } catch (error) {
    errorHandler.error(error)
    setDayDiets([])
  }
}

/**
 * Inserts a new day diet.
 * @param dayDiet - The new day diet data.
 * @returns True if inserted, false otherwise.
 */
export async function insertDayDiet(dayDiet: NewDayDiet): Promise<boolean> {
  try {
    await showPromise(
      dayRepository.insertDayDiet(dayDiet),
      {
        loading: 'Criando dia de dieta...',
        success: 'Dia de dieta criado com sucesso',
        error: 'Erro ao criar dia de dieta',
      },
      { context: 'user-action', audience: 'user' },
    )
    await fetchAllUserDayDiets(dayDiet.owner)
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
    await showPromise(
      dayRepository.updateDayDiet(dayId, dayDiet),
      {
        loading: 'Atualizando dieta...',
        success: 'Dieta atualizada com sucesso',
        error: 'Erro ao atualizar dieta',
      },
      { context: 'user-action', audience: 'user' },
    )
    await fetchAllUserDayDiets(dayDiet.owner)
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
    await showPromise(
      dayRepository.deleteDayDiet(dayId),
      {
        loading: 'Deletando dieta...',
        success: 'Dieta deletada com sucesso',
        error: 'Erro ao deletar dieta',
      },
      { context: 'user-action', audience: 'user' },
    )
    await fetchAllUserDayDiets(currentUserId())
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
