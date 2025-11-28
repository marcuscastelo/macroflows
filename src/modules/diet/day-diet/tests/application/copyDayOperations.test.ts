import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCopyDayOperations } from '~/modules/diet/day-diet/application/usecases/useCopyDayOperations'
import {
  createNewDayDiet,
  type DayDiet,
  promoteDayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { createDefaultMeals } from '~/modules/diet/day-diet/domain/defaultMeals'
import { type User } from '~/modules/user/domain/user'

// Mock the repository
vi.mock('~/modules/diet/day-diet/infrastructure/dayDietRepository', () => ({
  createDayDietRepository: vi.fn(() => ({
    fetchDayDietsByUserIdBeforeDate: vi.fn(),
    insertDayDiet: vi.fn(),
    updateDayDietById: vi.fn(),
  })),
}))

const mockRepository = {
  fetchDayDietByUserIdAndTargetDay: vi.fn(),
  fetchDayDietsByUserIdBeforeDate: vi.fn(),
  fetchDayDietById: vi.fn(),
  insertDayDiet: vi.fn(),
  updateDayDietById: vi.fn(),
  deleteDayDietById: vi.fn(),
}

function makeMockDayDiet(
  targetDay: string,
  user_id: User['uuid'] = '1',
): DayDiet {
  return promoteDayDiet(
    createNewDayDiet({
      target_day: targetDay,
      user_id,
      meals: createDefaultMeals(),
    }),
    { id: 1 },
  )
}

describe('CopyDayOperations', () => {
  let operations: ReturnType<typeof useCopyDayOperations>

  beforeEach(() => {
    vi.clearAllMocks()
    operations = useCopyDayOperations(mockRepository)
  })

  describe('initial state', () => {
    it('should have empty initial state', () => {
      const state = operations.state()

      expect(state.previousDays).toEqual([])
      expect(state.isLoadingPreviousDays).toBe(false)
      expect(state.copyingDay).toBe(null)
      expect(state.isCopying).toBe(false)
    })
  })

  describe('loadPreviousDays', () => {
    it('should load previous days successfully', async () => {
      const mockDays = [
        makeMockDayDiet('2023-01-01'),
        makeMockDayDiet('2023-01-02'),
      ]
      mockRepository.fetchDayDietsByUserIdBeforeDate.mockResolvedValueOnce(
        mockDays,
      )

      await operations.loadPreviousDays('1', '2023-01-03', 30)

      expect(
        mockRepository.fetchDayDietsByUserIdBeforeDate,
      ).toHaveBeenCalledWith('1', '2023-01-03', 30)
      expect(operations.state().previousDays).toEqual(mockDays)
      expect(operations.state().isLoadingPreviousDays).toBe(false)
    })

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: DayDiet[]) => void
      const promise = new Promise<DayDiet[]>((resolve) => {
        resolvePromise = resolve
      })
      mockRepository.fetchDayDietsByUserIdBeforeDate.mockReturnValueOnce(
        promise,
      )

      const loadPromise = operations.loadPreviousDays('1', '2023-01-03')

      expect(operations.state().isLoadingPreviousDays).toBe(true)

      resolvePromise!([])
      await loadPromise

      expect(operations.state().isLoadingPreviousDays).toBe(false)
    })

    it('should handle fetch error and call errorHandler.apiError', async () => {
      const error = new Error('Network error')
      mockRepository.fetchDayDietsByUserIdBeforeDate.mockRejectedValueOnce(
        error,
      )

      await expect(
        operations.loadPreviousDays('1', '2023-01-03'),
      ).rejects.toThrow('Network error')

      expect(operations.state().previousDays).toEqual([])
      expect(operations.state().isLoadingPreviousDays).toBe(false)
    })

    it('should not load if already loading', async () => {
      mockRepository.fetchDayDietsByUserIdBeforeDate.mockImplementation(
        () => new Promise(() => {}),
      ) // Never resolves

      const firstCall = operations.loadPreviousDays('1', '2023-01-03')
      const secondCall = operations.loadPreviousDays('1', '2023-01-03')

      await Promise.race([
        firstCall,
        secondCall,
        new Promise((resolve) => setTimeout(resolve, 10)), // Small timeout
      ])

      expect(
        mockRepository.fetchDayDietsByUserIdBeforeDate,
      ).toHaveBeenCalledTimes(1)
    })

    it('should use default limit of 30', async () => {
      mockRepository.fetchDayDietsByUserIdBeforeDate.mockResolvedValueOnce([])

      await operations.loadPreviousDays('1', '2023-01-03')

      expect(
        mockRepository.fetchDayDietsByUserIdBeforeDate,
      ).toHaveBeenCalledWith('1', '2023-01-03', 30)
    })
  })

  describe('copyDay', () => {
    it('should copy day successfully when no existing day', async () => {
      const sourceDayDiet = makeMockDayDiet('2023-01-01')
      const previousDays = [sourceDayDiet]

      mockRepository.insertDayDiet.mockResolvedValueOnce(undefined)

      await operations.copyDay({
        fromDay: '2023-01-01',
        toDay: '2023-01-03',
        previousDays,
      })

      expect(mockRepository.insertDayDiet).toHaveBeenCalledWith({
        target_day: '2023-01-03',
        user_id: sourceDayDiet.user_id,
        meals: sourceDayDiet.meals,
        __type: 'NewDayDiet',
      })
      expect(operations.state().isCopying).toBe(false)
      expect(operations.state().copyingDay).toBe(null)
    })

    it('should update existing day when provided', async () => {
      const sourceDayDiet = makeMockDayDiet('2023-01-01')
      const existingDayDiet = makeMockDayDiet('2023-01-03')
      const previousDays = [sourceDayDiet]

      mockRepository.updateDayDietById.mockResolvedValueOnce(undefined)

      await operations.copyDay({
        fromDay: '2023-01-01',
        toDay: '2023-01-03',
        existingDay: existingDayDiet,
        previousDays,
      })

      expect(mockRepository.updateDayDietById).toHaveBeenCalledWith(
        existingDayDiet.id,
        {
          target_day: '2023-01-03',
          user_id: sourceDayDiet.user_id,
          meals: sourceDayDiet.meals,
          __type: 'NewDayDiet',
        },
      )
    })

    it('should set copying state during operation', async () => {
      const sourceDayDiet = makeMockDayDiet('2023-01-01')
      const previousDays = [sourceDayDiet]

      let resolvePromise: () => void
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve
      })
      mockRepository.insertDayDiet.mockReturnValueOnce(promise)

      const copyPromise = operations.copyDay({
        fromDay: '2023-01-01',
        toDay: '2023-01-03',
        previousDays,
      })

      expect(operations.state().isCopying).toBe(true)
      expect(operations.state().copyingDay).toBe('2023-01-01')

      resolvePromise!()
      await copyPromise

      expect(operations.state().isCopying).toBe(false)
      expect(operations.state().copyingDay).toBe(null)
    })

    it('should throw error when source day not found', async () => {
      const previousDays: DayDiet[] = []

      await expect(
        operations.copyDay({
          fromDay: '2023-01-01',
          toDay: '2023-01-03',
          previousDays,
        }),
      ).rejects.toThrow('No matching previous day found for 2023-01-01')

      expect(operations.state().isCopying).toBe(false)
      expect(operations.state().copyingDay).toBe(null)
    })

    it('should handle fetch error and call errorHandler.apiError', async () => {
      const sourceDayDiet = makeMockDayDiet('2023-01-01')
      const previousDays = [sourceDayDiet]
      const error = new Error('Database error')

      mockRepository.insertDayDiet.mockRejectedValueOnce(error)

      await expect(
        operations.copyDay({
          fromDay: '2023-01-01',
          toDay: '2023-01-03',
          previousDays,
        }),
      ).rejects.toThrow('Database error')
      expect(operations.state().isCopying).toBe(false)
      expect(operations.state().copyingDay).toBe(null)
    })
  })

  describe('resetState', () => {
    it('should reset all state to initial values', async () => {
      // Set some state first
      mockRepository.fetchDayDietsByUserIdBeforeDate.mockResolvedValueOnce([
        makeMockDayDiet('2023-01-01'),
      ])
      await operations.loadPreviousDays('1', '2023-01-03')

      // Verify state is set
      expect(operations.state().previousDays).toHaveLength(1)

      // Reset
      operations.resetState()

      // Verify reset
      const state = operations.state()
      expect(state.previousDays).toEqual([])
      expect(state.isLoadingPreviousDays).toBe(false)
      expect(state.copyingDay).toBe(null)
      expect(state.isCopying).toBe(false)
    })
  })
})
