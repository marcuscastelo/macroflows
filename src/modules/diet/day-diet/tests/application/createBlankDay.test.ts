import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createBlankDay } from '~/modules/diet/day-diet/application/usecases/createBlankDay'
import { dayUseCases } from '~/modules/diet/day-diet/application/usecases/dayUseCases'
import { createDefaultMeals } from '~/modules/diet/day-diet/domain/defaultMeals'

// Mock the dayCrud module
vi.mock('~/modules/diet/day-diet/application/usecases/dayCrud', () => ({
  insertDayDiet: vi.fn(),
}))

// Mock the defaultMeals module
vi.mock('~/modules/diet/day-diet/domain/defaultMeals', () => ({
  createDefaultMeals: vi.fn(),
}))

// Mock showPromise toast function
vi.mock('~/modules/toast/application/toastManager', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  showPromise: vi.fn((promise) => promise), // Pass through the promise
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))

describe('createBlankDay', () => {
  const mockCreateDefaultMeals = vi.mocked(createDefaultMeals)

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateDefaultMeals.mockReturnValue([])
  })

  it('should create a blank day with default meals', async () => {
    const mockMeals = [
      { id: 1, name: 'Café da manhã', items: [], __type: 'Meal' as const },
      { id: 2, name: 'Almoço', items: [], __type: 'Meal' as const },
    ]
    mockCreateDefaultMeals.mockReturnValue(mockMeals)
    vi.spyOn(dayUseCases, 'insertDayDiet').mockResolvedValueOnce(null)

    await createBlankDay('123', '2023-01-01')

    expect(mockCreateDefaultMeals).toHaveBeenCalledOnce()
    expect(dayUseCases.insertDayDiet).toHaveBeenCalledWith({
      user_id: '123',
      target_day: '2023-01-01',
      meals: mockMeals,
      __type: 'NewDayDiet',
    })
  })

  it('should handle different user IDs and dates', async () => {
    vi.spyOn(dayUseCases, 'insertDayDiet').mockResolvedValueOnce(null)

    await createBlankDay('456', '2023-12-25')

    expect(dayUseCases.insertDayDiet).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: '456',
        target_day: '2023-12-25',
      }),
    )
  })

  it('should propagate insertDayDiet errors', async () => {
    const error = new Error('Database error')
    vi.spyOn(dayUseCases, 'insertDayDiet').mockRejectedValueOnce(error)

    await expect(createBlankDay('123', '2023-01-01')).rejects.toThrow(
      'Database error',
    )
  })

  it('should create new day diet with correct structure', async () => {
    const mockMeals = [
      { id: 1, name: 'Café da manhã', items: [], __type: 'Meal' as const },
    ]
    mockCreateDefaultMeals.mockReturnValue(mockMeals)
    vi.spyOn(dayUseCases, 'insertDayDiet').mockResolvedValueOnce(null)

    await createBlankDay('789', '2023-06-15')

    expect(dayUseCases.insertDayDiet).toHaveBeenCalledWith({
      __type: 'NewDayDiet',
      user_id: '789',
      target_day: '2023-06-15',
      meals: mockMeals,
    })
  })

  it('should handle empty meals from createDefaultMeals', async () => {
    mockCreateDefaultMeals.mockReturnValue([])
    vi.spyOn(dayUseCases, 'insertDayDiet').mockResolvedValueOnce(null)

    await createBlankDay('100', '2023-01-01')

    expect(dayUseCases.insertDayDiet).toHaveBeenCalledWith(
      expect.objectContaining({
        meals: [],
      }),
    )
  })
})
