import { describe, expect, it, vi } from 'vitest'

import { createCacheManagementService } from '~/modules/diet/day-diet/application/services/cacheManagement'
import {
  createNewDayDiet,
  promoteDayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'

describe('cacheManagementService', () => {
  describe('when there are days from other users', () => {
    const myUserId = 1
    const otherUserId = 2
    it('should clear cache and fetch current day', () => {
      const clearCache = vi.fn()
      const fetchTargetDay = vi.fn()
      const getCurrentDayDiet = vi.fn(() =>
        promoteDayDiet(
          createNewDayDiet({
            meals: [],
            owner: myUserId,
            target_day: '2023-01-01',
          }),
          { id: 1 },
        ),
      )
      const getExistingDays = vi.fn(() => [
        promoteDayDiet(
          createNewDayDiet({
            meals: [],
            owner: otherUserId, // Different user than current userId
            target_day: '2023-01-01',
          }),
          { id: 1 },
        ),
      ])

      const runService = createCacheManagementService({
        clearCache,
        getCurrentDayDiet,
        getExistingDays,
        fetchTargetDay,
      })

      runService({
        currentTargetDay: '2023-01-01',
        userId: myUserId,
      })

      expect(clearCache).toHaveBeenCalledOnce()
      expect(fetchTargetDay).toHaveBeenCalledWith(1, '2023-01-01')
    })
  })

  describe('when current day diet is null', () => {
    it('should fetch target day', () => {
      const clearCache = vi.fn()
      const fetchTargetDay = vi.fn()
      const getCurrentDayDiet = vi.fn(() => null)
      const getExistingDays = vi.fn(() => [])

      const runService = createCacheManagementService({
        clearCache,
        getCurrentDayDiet,
        getExistingDays,
        fetchTargetDay,
      })

      runService({
        currentTargetDay: '2023-01-01',
        userId: 1,
      })

      expect(clearCache).not.toHaveBeenCalled()
      expect(fetchTargetDay).toHaveBeenCalledWith(1, '2023-01-01')
    })
  })

  describe('when cache is valid and current day exists', () => {
    it('should not clear cache or fetch data', () => {
      const clearCache = vi.fn()
      const fetchTargetDay = vi.fn()
      const getCurrentDayDiet = vi.fn(() =>
        promoteDayDiet(
          createNewDayDiet({
            meals: [],
            owner: 1,
            target_day: '2023-01-01',
          }),
          { id: 1 },
        ),
      )
      const getExistingDays = vi.fn(() => [
        promoteDayDiet(
          createNewDayDiet({
            meals: [],
            owner: 1, // Same user
            target_day: '2023-01-01',
          }),
          { id: 1 },
        ),
      ])

      const runService = createCacheManagementService({
        clearCache,
        getCurrentDayDiet,
        getExistingDays,
        fetchTargetDay,
      })

      runService({
        currentTargetDay: '2023-01-01',
        userId: 1,
      })

      expect(clearCache).not.toHaveBeenCalled()
      expect(fetchTargetDay).not.toHaveBeenCalled()
    })
  })

  describe('when there are multiple days with mixed users', () => {
    it('should clear cache when any day belongs to different user', () => {
      const clearCache = vi.fn()
      const fetchTargetDay = vi.fn()
      const getCurrentDayDiet = vi.fn(() => null)
      const getExistingDays = vi.fn(() => [
        promoteDayDiet(
          createNewDayDiet({
            meals: [],
            owner: 1, // Same user
            target_day: '2023-01-01',
          }),
          { id: 1 },
        ),
        promoteDayDiet(
          createNewDayDiet({
            meals: [],
            owner: 2, // Different user - should trigger purge
            target_day: '2023-01-02',
          }),
          { id: 2 },
        ),
      ])

      const runService = createCacheManagementService({
        clearCache,
        getCurrentDayDiet,
        getExistingDays,
        fetchTargetDay,
      })

      runService({
        currentTargetDay: '2023-01-01',
        userId: 1,
      })

      expect(clearCache).toHaveBeenCalledOnce()
      expect(fetchTargetDay).toHaveBeenCalledWith(1, '2023-01-01')
    })
  })
})
