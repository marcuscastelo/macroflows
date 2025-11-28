import {
  batch,
  createEffect,
  createRoot,
  onCleanup,
  onMount,
  untrack,
} from 'solid-js'

import { startDayChangeDetectionWorker } from '~/modules/diet/day-diet/application/services/dayChange'
import { createDayCacheStore } from '~/modules/diet/day-diet/application/store/dayCacheStore'
import { createDayChangeStore } from '~/modules/diet/day-diet/application/store/dayChangeStore'
import { createDayStateStore } from '~/modules/diet/day-diet/application/store/dayStateStore'
import {
  type DayDiet,
  type NewDayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { createDayDietRepository } from '~/modules/diet/day-diet/infrastructure/dayDietRepository'
import { initializeDayDietRealtime } from '~/modules/diet/day-diet/infrastructure/supabase/realtime'
import { showPromise } from '~/modules/toast/application/toastManager'
import { currentUserId } from '~/modules/user/application/user'
import { type User } from '~/modules/user/domain/user'
import { getTodayYYYYMMDD } from '~/shared/utils/date/dateUtils'
import { logging } from '~/shared/utils/logging'

export const dayUseCases = createRoot(() => {
  const dayChangeStore = createDayChangeStore()
  const dayStateStore = createDayStateStore()
  const dayCacheStore = createDayCacheStore()

  const dayRepository = createDayDietRepository()

  const runTargetDayReset = () => {
    logging.debug(`Effect - Reset to today!`)
    const today = getTodayYYYYMMDD()
    dayStateStore.setTargetDay(today)
  }

  initializeDayDietRealtime({
    onInsert(newDayDiet) {
      dayCacheStore.upsertToCache(newDayDiet)
    },
    onUpdate(newDayDiet) {
      dayCacheStore.upsertToCache(newDayDiet)
    },
    onDelete(oldDayDiet) {
      dayCacheStore.removeFromCache({
        by: 'target_day',
        value: oldDayDiet.target_day,
      })
    },
  })

  onMount(() => {
    const cleanup = startDayChangeDetectionWorker({
      getTodayYYYYMMDD,
      getPreviousToday: () => untrack(dayChangeStore.currentToday),
      getCurrentTargetDay: () => untrack(dayStateStore.targetDay),
      setCurrentToday: dayChangeStore.setCurrentToday,
      setDayChangeData: dayChangeStore.setDayChangeData,
    })

    onCleanup(cleanup)
  })

  createEffect(() => {
    const userId = currentUserId()
    const currentTargetDay = dayStateStore.targetDay()

    dayCacheStore.runCacheManagement({
      userId,
      currentTargetDay,
      currentDayDiet: obj.currentDayDiet,
    })
  })

  createEffect(() => {
    const userId = currentUserId()
    logging.debug(`User changed to ${userId}, resetting target day`)
    runTargetDayReset()
  })

  const obj = {
    currentToday: dayChangeStore.currentToday,
    dayChangeData: dayChangeStore.dayChangeData,
    dismissDayChangeModal: () => dayChangeStore.setDayChangeData(null),
    acceptDayChange: () => {
      const changeData = dayChangeStore.dayChangeData()
      if (changeData) {
        batch(() => {
          dayCacheStore.clearCache()
          dayStateStore.setTargetDay(changeData.newDay)
          dayChangeStore.setDayChangeData(null)
        })
      }
    },
    targetDay: dayStateStore.targetDay,
    setTargetDay: dayStateStore.setTargetDay,
    currentDayDiet: () =>
      dayCacheStore.createCacheItemSignal({
        by: 'target_day',
        value: dayStateStore.targetDay(),
      }),
    fetchDayDietById: async (dayId: DayDiet['id']) => {
      try {
        const dayDiet = await dayRepository.fetchDayDietById(dayId)
        if (dayDiet === null) {
          dayCacheStore.removeFromCache({ by: 'id', value: dayId })
          return null
        }
        dayCacheStore.upsertToCache(dayDiet)
        return dayDiet
      } catch (error) {
        logging.error('DayDiet fetch error:', error)
        dayCacheStore.removeFromCache({ by: 'id', value: dayId })
        return null
      }
    },
    fetchDayDietByUserIdAndTargetDay: async (
      userId: User['uuid'],
      targetDay: string,
    ) => {
      try {
        const dayDiet = await dayRepository.fetchDayDietByUserIdAndTargetDay(
          userId,
          targetDay,
        )
        if (dayDiet === null) {
          dayCacheStore.removeFromCache({ by: 'target_day', value: targetDay })
          return null
        }
        dayCacheStore.upsertToCache(dayDiet)
        return dayDiet
      } catch (error) {
        logging.error('DayDiet fetch error:', error)
        dayCacheStore.removeFromCache({ by: 'target_day', value: targetDay })
        return null
      }
    },
    fetchDayDietsByUserIdBeforeDate: async (
      userId: User['uuid'],
      beforeDay: string,
      limit: number = 30,
    ) => {
      try {
        const previousDays =
          await dayRepository.fetchDayDietsByUserIdBeforeDate(
            userId,
            beforeDay,
            limit,
          )
        for (const day of previousDays) {
          dayCacheStore.upsertToCache(day)
        }
        return previousDays
      } catch (error) {
        logging.error('DayDiet fetch error:', error)
        return []
      }
    },
    insertDayDiet: async (dayDiet: NewDayDiet) => {
      try {
        const insertedDayDiet = await showPromise(
          dayRepository.insertDayDiet(dayDiet),
          {
            loading: 'Criando dia de dieta...',
            success: 'Dia de dieta criado com sucesso',
            error: 'Erro ao criar dia de dieta',
          },
          { context: 'user-action' },
        )
        if (insertedDayDiet !== null) {
          dayCacheStore.upsertToCache(insertedDayDiet)
        }
        return insertedDayDiet
      } catch (error) {
        logging.error('DayDiet insert error:', error)
        return null
      }
    },
    updateDayDietById: async (dayId: DayDiet['id'], dayDiet: NewDayDiet) => {
      try {
        const updatedDayDiet = await showPromise(
          dayRepository.updateDayDietById(dayId, dayDiet),
          {
            loading: 'Atualizando dieta...',
            success: 'Dieta atualizada com sucesso',
            error: 'Erro ao atualizar dieta',
          },
          { context: 'user-action' },
        )
        if (updatedDayDiet !== null) {
          dayCacheStore.upsertToCache(updatedDayDiet)
        }
        return updatedDayDiet
      } catch (error) {
        logging.error('DayDiet update error:', error)
        return null
      }
    },
    deleteDayDietById: async (dayId: DayDiet['id']) => {
      try {
        await showPromise(
          dayRepository.deleteDayDietById(dayId),
          {
            loading: 'Deletando dieta...',
            success: 'Dieta deletada com sucesso',
            error: 'Erro ao deletar dieta',
          },
          { context: 'user-action' },
        )
        dayCacheStore.removeFromCache({ by: 'id', value: dayId })
      } catch (error) {
        logging.error('DayDiet delete error:', error)
        return null
      }
    },
  }

  createEffect(() => {
    logging.debug(`CurrentDayDiet:`, { currentDayDiet: obj.currentDayDiet() })
  })

  return obj
})
