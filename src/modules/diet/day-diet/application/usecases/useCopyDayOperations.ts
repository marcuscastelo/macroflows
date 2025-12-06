import { createResource, createSignal } from 'solid-js'

import type { DayUseCases } from '~/modules/diet/day-diet/application/usecases/dayUseCases'
import { dayUseCases } from '~/modules/diet/day-diet/application/usecases/dayUseCases'
import {
  createNewDayDiet,
  type DayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { type User } from '~/modules/user/domain/user'
import { logging } from '~/shared/utils/logging'

/**
 * Factory that creates copy-day operations and hooks.
 * Accepts a provider for `dayUseCases` to allow DI wiring and avoid init-order issues.
 */
export function createCopyDayOperations(deps: {
  dayUseCases: () => DayUseCases
}) {
  const { dayUseCases: getDayUseCases } = deps

  async function copyDay(params: {
    fromDay: string
    toDay: string
    existingDay?: DayDiet
    previousDays: readonly DayDiet[]
  }) {
    const { fromDay, toDay, existingDay, previousDays } = params

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
        await getDayUseCases().updateDayDietById(existingDay.id, newDay)
      } else {
        await getDayUseCases().insertDayDiet(newDay)
      }
    } catch (error) {
      logging.error('CopyDayOperations copyDay error:', error)
      throw error
    }
  }

  function useCopyDayUseCase() {
    const [params, setParams] = createSignal<
      { userId: User['uuid']; beforeDay: string; limit: number } | undefined
    >(undefined)

    const fetcher = async (p?: {
      userId: User['uuid']
      beforeDay: string
      limit: number
    }) => {
      if (!p) {
        const empty: readonly DayDiet[] = []
        return empty
      }

      const days = await getDayUseCases().fetchDayDietsByUserIdBeforeDate(
        p.userId,
        p.beforeDay,
        p.limit,
      )
      return days
    }

    const [previousDays, { mutate }] = createResource(params, fetcher)
    const [copyingDay, setCopyingDay] = createSignal<string | null>(null)
    const [isCopying, setIsCopying] = createSignal(false)

    return {
      copyingDay: () => copyingDay(),
      isCopying: () => isCopying(),
      handleStartCopying: (fromDay: string) => {
        setCopyingDay(fromDay)
        setIsCopying(true)
      },
      handleFinishCopying: () => {
        setIsCopying(false)
        setCopyingDay(null)
      },

      // previousDays is a Solid resource. Use `fetchPreviousDays` to load data into it.
      previousDays,
      fetchPreviousDays: (
        userId: User['uuid'],
        beforeDay: string,
        limit: number = 30,
      ): void => {
        setParams({ userId, beforeDay, limit })
      },

      mutatePreviousDays: (
        v:
          | readonly DayDiet[]
          | ((
              p: readonly DayDiet[] | undefined,
            ) => readonly DayDiet[] | undefined),
      ) => mutate(v),

      resetState: (): void => {
        setParams(undefined)
        const empty: readonly DayDiet[] = []
        void mutate(empty)
        setCopyingDay(null)
        setIsCopying(false)
      },
    }
  }

  return {
    copyDay,
    useCopyDayUseCase,
  }
}

/**
 * Backward-compatible shim: keep existing named exports working while consumers migrate.
 * The shim wires the factory to the current `dayUseCases`.
 */
const _defaultCopyOps = createCopyDayOperations({
  dayUseCases: () => dayUseCases,
})

export const copyDay = _defaultCopyOps.copyDay
export const useCopyDayUseCase = _defaultCopyOps.useCopyDayUseCase
