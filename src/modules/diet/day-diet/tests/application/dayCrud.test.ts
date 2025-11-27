import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createNewDayDiet,
  type DayDiet,
  promoteDayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { createDefaultMeals } from '~/modules/diet/day-diet/domain/defaultMeals'

// Mock the repository
vi.mock('~/modules/diet/day-diet/infrastructure/dayDietRepository', () => ({
  createDayDietRepository: vi.fn(() => ({
    fetchDayDietByUserIdAndTargetDay: vi.fn(),
    fetchDayDietsByUserIdBeforeDate: vi.fn(),
    insertDayDiet: vi.fn(),
    updateDayDietById: vi.fn(),
    deleteDayDietById: vi.fn(),
  })),
}))

// Mock showPromise toast function
vi.mock('~/modules/toast/application/toastManager', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  showPromise: vi.fn((promise) => promise), // Pass through the promise
}))

import { showPromise } from '~/modules/toast/application/toastManager'

const mockRepository = {
  fetchDayDietById: vi.fn(),
  fetchDayDietByUserIdAndTargetDay: vi.fn(),
  fetchDayDietsByUserIdBeforeDate: vi.fn(),
  insertDayDiet: vi.fn(),
  updateDayDietById: vi.fn(),
  deleteDayDietById: vi.fn(),
} satisfies DayRepository

// Import the createCrud function
import { createCrud } from '~/modules/diet/day-diet/application/usecases/dayCrud'
import { type DayRepository } from '~/modules/diet/day-diet/domain/dayDietRepository'
import { type User } from '~/modules/user/domain/user'

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

describe('Day Diet CRUD Operations', () => {
  let crud: ReturnType<typeof createCrud>

  beforeEach(() => {
    vi.clearAllMocks()
    crud = createCrud(mockRepository)
  })

  describe('fetchTargetDay', () => {
    it('should call repository with correct parameters', async () => {
      mockRepository.fetchDayDietByUserIdAndTargetDay.mockResolvedValueOnce(
        undefined,
      )

      await crud.fetchTargetDay('1', '2023-01-01')

      expect(
        mockRepository.fetchDayDietByUserIdAndTargetDay,
      ).toHaveBeenCalledWith('1', '2023-01-01')
    })

    it('should handle repository errors', async () => {
      const error = new Error('Database error')
      mockRepository.fetchDayDietByUserIdAndTargetDay.mockRejectedValueOnce(
        error,
      )

      await expect(crud.fetchTargetDay('1', '2023-01-01')).rejects.toThrow(
        'Database error',
      )
    })
  })

  describe('fetchPreviousDayDiets', () => {
    it('should fetch previous days with default limit', async () => {
      const mockDays = [
        makeMockDayDiet('2023-01-01'),
        makeMockDayDiet('2023-01-02'),
      ]
      mockRepository.fetchDayDietsByUserIdBeforeDate.mockResolvedValueOnce(
        mockDays,
      )

      const result = await crud.fetchPreviousDayDiets('1', '2023-01-03')

      expect(
        mockRepository.fetchDayDietsByUserIdBeforeDate,
      ).toHaveBeenCalledWith('1', '2023-01-03', 30)
      expect(result).toEqual(mockDays)
    })

    it('should fetch previous days with custom limit', async () => {
      const mockDays = [makeMockDayDiet('2023-01-01')]
      mockRepository.fetchDayDietsByUserIdBeforeDate.mockResolvedValueOnce(
        mockDays,
      )

      const result = await crud.fetchPreviousDayDiets('1', '2023-01-03', 10)

      expect(
        mockRepository.fetchDayDietsByUserIdBeforeDate,
      ).toHaveBeenCalledWith('1', '2023-01-03', 10)
      expect(result).toEqual(mockDays)
    })

    it('should handle empty results', async () => {
      mockRepository.fetchDayDietsByUserIdBeforeDate.mockResolvedValueOnce([])

      const result = await crud.fetchPreviousDayDiets('1', '2023-01-03')

      expect(result).toEqual([])
    })

    it('should handle repository errors', async () => {
      const error = new Error('Network error')
      mockRepository.fetchDayDietsByUserIdBeforeDate.mockRejectedValueOnce(
        error,
      )

      await expect(
        crud.fetchPreviousDayDiets('1', '2023-01-03'),
      ).rejects.toThrow('Network error')
    })
  })

  describe('insertDayDiet', () => {
    it('should insert day diet with toast notifications', async () => {
      const newDayDiet = createNewDayDiet({
        target_day: '2023-01-01',
        user_id: '1',
        meals: createDefaultMeals(),
      })

      mockRepository.insertDayDiet.mockResolvedValueOnce(undefined)

      await crud.insertDayDiet(newDayDiet)

      expect(mockRepository.insertDayDiet).toHaveBeenCalledWith(newDayDiet)

      expect(showPromise).toHaveBeenCalledWith(
        expect.any(Promise),
        {
          loading: 'Criando dia de dieta...',
          success: 'Dia de dieta criado com sucesso',
          error: 'Erro ao criar dia de dieta',
        },
        { context: 'user-action' },
      )
    })

    it('should handle repository errors with toast', async () => {
      const newDayDiet = createNewDayDiet({
        target_day: '2023-01-01',
        user_id: '1',
        meals: [],
      })

      const error = new Error('Insert failed')
      mockRepository.insertDayDiet.mockRejectedValueOnce(error)

      await expect(crud.insertDayDiet(newDayDiet)).rejects.toThrow(
        'Insert failed',
      )
    })
  })

  describe('updateDayDiet', () => {
    it('should update day diet with toast notifications', async () => {
      const dayDiet = makeMockDayDiet('2023-01-01')
      const updatedData = createNewDayDiet({
        target_day: '2023-01-01',
        user_id: '1',
        meals: createDefaultMeals(),
      })

      mockRepository.updateDayDietById.mockResolvedValueOnce(undefined)

      await crud.updateDayDiet(dayDiet.id, updatedData)

      expect(mockRepository.updateDayDietById).toHaveBeenCalledWith(
        dayDiet.id,
        updatedData,
      )

      expect(showPromise).toHaveBeenCalledWith(
        expect.any(Promise),
        {
          loading: 'Atualizando dieta...',
          success: 'Dieta atualizada com sucesso',
          error: 'Erro ao atualizar dieta',
        },
        { context: 'user-action' },
      )
    })

    it('should handle repository errors with toast', async () => {
      const error = new Error('Update failed')
      mockRepository.updateDayDietById.mockRejectedValueOnce(error)

      const newDayDiet = createNewDayDiet({
        target_day: '2023-01-01',
        user_id: '1',
        meals: [],
      })

      await expect(crud.updateDayDiet(1, newDayDiet)).rejects.toThrow(
        'Update failed',
      )
    })
  })

  describe('deleteDayDiet', () => {
    it('should delete day diet with toast notifications', async () => {
      const dayDiet = makeMockDayDiet('2023-01-01')

      mockRepository.deleteDayDietById.mockResolvedValueOnce(undefined)

      await crud.deleteDayDiet(dayDiet.id)

      expect(mockRepository.deleteDayDietById).toHaveBeenCalledWith(dayDiet.id)

      expect(showPromise).toHaveBeenCalledWith(
        expect.any(Promise),
        {
          loading: 'Deletando dieta...',
          success: 'Dieta deletada com sucesso',
          error: 'Erro ao deletar dieta',
        },
        { context: 'user-action' },
      )
    })

    it('should handle repository errors with toast', async () => {
      const error = new Error('Delete failed')
      mockRepository.deleteDayDietById.mockRejectedValueOnce(error)

      await expect(crud.deleteDayDiet(1)).rejects.toThrow('Delete failed')
    })
  })

  describe('Error Handling Integration', () => {
    it('should propagate repository errors correctly', async () => {
      const repositoryError = new Error('Connection timeout')
      mockRepository.insertDayDiet.mockRejectedValueOnce(repositoryError)

      const newDayDiet = createNewDayDiet({
        target_day: '2023-01-01',
        user_id: '1',
        meals: [],
      })

      // The error should propagate through showPromise
      await expect(crud.insertDayDiet(newDayDiet)).rejects.toThrow(
        'Connection timeout',
      )
    })

    it('should handle multiple operations independently', async () => {
      const dayDiet = makeMockDayDiet('2023-01-01')

      // First operation succeeds
      mockRepository.fetchDayDietByUserIdAndTargetDay.mockResolvedValueOnce(
        undefined,
      )
      await expect(
        crud.fetchTargetDay('1', '2023-01-01'),
      ).resolves.toBeUndefined()

      // Second operation fails
      mockRepository.deleteDayDietById.mockRejectedValueOnce(
        new Error('Delete error'),
      )
      await expect(crud.deleteDayDiet(dayDiet.id)).rejects.toThrow(
        'Delete error',
      )

      // Verify both calls were made
      expect(
        mockRepository.fetchDayDietByUserIdAndTargetDay,
      ).toHaveBeenCalledTimes(1)
      expect(mockRepository.deleteDayDietById).toHaveBeenCalledTimes(1)
    })
  })
})
