import { createSignal } from 'solid-js'

import {
  createNewDayDiet,
  type DayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { createDayDietRepository } from '~/modules/diet/day-diet/infrastructure/dayDietRepository'
import { type User } from '~/modules/user/domain/user'
import { logging } from '~/shared/utils/logging'

export function useCopyDayUseCase(repository = createDayDietRepository()) {
  const [previousDays, setPreviousDays] = createSignal<readonly DayDiet[]>([])
  const [isLoadingPreviousDays, setIsLoadingPreviousDays] = createSignal(false)
  const [copyingDay, setCopyingDay] = createSignal<string | null>(null)
  const [isCopying, setIsCopying] = createSignal(false)

  const state = () => ({
    previousDays: previousDays(),
    isLoadingPreviousDays: isLoadingPreviousDays(),
    copyingDay: copyingDay(),
    isCopying: isCopying(),
  })

  const loadPreviousDays = async (
    userId: User['uuid'],
    beforeDay: string,
    limit: number = 30,
  ): Promise<void> => {
    if (isLoadingPreviousDays()) return

    setIsLoadingPreviousDays(true)
    try {
      const days = await repository.fetchDayDietsByUserIdBeforeDate(
        userId,
        beforeDay,
        limit,
      )
      setPreviousDays(days)
    } catch (error) {
      logging.error('CopyDayOperations loadPreviousDays error:', error)
      setPreviousDays([])
      throw error
    } finally {
      setIsLoadingPreviousDays(false)
    }
  }

  const copyDay = async (params: {
    fromDay: string
    toDay: string
    existingDay?: DayDiet
    previousDays: readonly DayDiet[]
  }): Promise<void> => {
    const { fromDay, toDay, existingDay, previousDays } = params

    setCopyingDay(fromDay)
    setIsCopying(true)

    try {
      const copyFrom = previousDays.find((d) => d.target_day === fromDay)
      if (!copyFrom) {
        throw new Error(`No matching previous day found for ${fromDay}`, {
          cause: {
            fromDay,
            availableDays: previousDays.map((d) => d.target_day),
          },
        })
      }

      const newDay = createNewDayDiet({
        target_day: toDay,
        user_id: copyFrom.user_id,
        meals: copyFrom.meals,
      })

      if (existingDay) {
        await repository.updateDayDietById(existingDay.id, newDay)
      } else {
        await repository.insertDayDiet(newDay)
      }
    } catch (error) {
      logging.error('CopyDayOperations copyDay error:', error)
      throw error
    } finally {
      setIsCopying(false)
      setCopyingDay(null)
    }
  }

  const resetState = (): void => {
    setPreviousDays([])
    setIsLoadingPreviousDays(false)
    setCopyingDay(null)
    setIsCopying(false)
  }

  return {
    state,
    loadPreviousDays,
    copyDay,
    resetState,
  }
}
