import { createSignal } from 'solid-js'

import {
  createNewDayDiet,
  type DayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { createDayDietRepository } from '~/modules/diet/day-diet/infrastructure/dayDietRepository'
import { type User } from '~/modules/user/domain/user'
import { createErrorHandler } from '~/shared/error/errorHandler'
import { trackDayCopy } from '~/shared/performance'
import { withSpan } from '~/shared/utils/tracing'

export type CopyDayState = {
  previousDays: readonly DayDiet[]
  isLoadingPreviousDays: boolean
  copyingDay: string | null
  isCopying: boolean
}

export type CopyDayOperations = {
  state: () => CopyDayState
  loadPreviousDays: (
    userId: User['id'],
    beforeDay: string,
    limit?: number,
  ) => Promise<void>
  copyDay: (params: {
    fromDay: string
    toDay: string
    existingDay?: DayDiet | undefined
    previousDays: readonly DayDiet[]
  }) => Promise<void>
  resetState: () => void
}

function createCopyDayOperations(
  repository = createDayDietRepository(),
): CopyDayOperations {
  const errorHandler = createErrorHandler('application', 'dayDiet')
  const [previousDays, setPreviousDays] = createSignal<readonly DayDiet[]>([])
  const [isLoadingPreviousDays, setIsLoadingPreviousDays] = createSignal(false)
  const [copyingDay, setCopyingDay] = createSignal<string | null>(null)
  const [isCopying, setIsCopying] = createSignal(false)

  const state = (): CopyDayState => ({
    previousDays: previousDays(),
    isLoadingPreviousDays: isLoadingPreviousDays(),
    copyingDay: copyingDay(),
    isCopying: isCopying(),
  })

  const loadPreviousDays = async (
    userId: User['id'],
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
      errorHandler.apiError(error, {
        component: 'CopyDayOperations',
        operation: 'loadPreviousDays',
        additionalData: { userId, beforeDay, limit },
      })
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
    const copyFrom = params.previousDays.find(
      (d) => d.target_day === params.fromDay,
    )
    const userId = String(copyFrom?.owner ?? 'unknown')

    return await trackDayCopy(
      userId,
      params.fromDay,
      params.toDay,
      async () => {
        return await withSpan('day_diet.copy_operation', async (span) => {
          const { fromDay, toDay, existingDay, previousDays } = params

          span.setAttributes({
            'day_diet.from_day': fromDay,
            'day_diet.to_day': toDay,
            'day_diet.has_existing_day': !!existingDay,
            'day_diet.previous_days_count': previousDays.length,
            'operation.type': 'copy_day',
          })

          setCopyingDay(fromDay)
          setIsCopying(true)

          try {
            const copyFrom = previousDays.find((d) => d.target_day === fromDay)
            if (!copyFrom) {
              span.addEvent('copy_day_source_not_found', {
                fromDay,
                availableDaysCount: previousDays.length,
              })
              throw new Error(`No matching previous day found for ${fromDay}`, {
                cause: {
                  fromDay,
                  availableDays: previousDays.map((d) => d.target_day),
                },
              })
            }

            span.addEvent('copy_day_source_found', {
              fromDay,
              mealsCount: copyFrom.meals.length,
              ownerId: copyFrom.owner,
            })

            const newDay = createNewDayDiet({
              target_day: toDay,
              owner: copyFrom.owner,
              meals: copyFrom.meals,
            })

            if (existingDay) {
              span.addEvent('updating_existing_day', {
                existingDayId: existingDay.id,
              })
              await repository.updateDayDietById(existingDay.id, newDay)
            } else {
              span.addEvent('inserting_new_day')
              await repository.insertDayDiet(newDay)
            }

            span.addEvent('copy_day_completed', {
              fromDay,
              toDay,
              mealsCount: copyFrom.meals.length,
            })
          } catch (error) {
            span.addEvent('copy_day_error', {
              error: String(error),
              fromDay,
              toDay,
            })
            errorHandler.apiError(error, {
              component: 'CopyDayOperations',
              operation: 'copyDay',
              additionalData: { fromDay, toDay, hasExistingDay: !!existingDay },
            })
            throw error
          } finally {
            setIsCopying(false)
            setCopyingDay(null)
          }
        })
      },
    )
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

const defaultOperations = createCopyDayOperations()

export { createCopyDayOperations }
export const { state, loadPreviousDays, copyDay, resetState } =
  defaultOperations
