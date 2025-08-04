import {
  type DayDiet,
  type NewDayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { createDayDietRepository } from '~/modules/diet/day-diet/infrastructure/dayDietRepository'
import { showPromise } from '~/modules/toast/application/toastManager'
import { type User } from '~/modules/user/domain/user'

function createCrud(repository = createDayDietRepository()) {
  const fetchTargetDay = async (
    userId: User['id'],
    targetDay: string,
  ): Promise<void> => {
    await repository.fetchDayDietByUserIdAndTargetDay(userId, targetDay)
  }

  const fetchPreviousDayDiets = async (
    userId: User['id'],
    beforeDay: string,
    limit: number = 30,
  ): Promise<readonly DayDiet[]> => {
    return await repository.fetchDayDietsByUserIdBeforeDate(
      userId,
      beforeDay,
      limit,
    )
  }

  const insertDayDiet = async (dayDiet: NewDayDiet): Promise<void> => {
    await showPromise(
      repository.insertDayDiet(dayDiet),
      {
        loading: 'Criando dia de dieta...',
        success: 'Dia de dieta criado com sucesso',
        error: 'Erro ao criar dia de dieta',
      },
      { context: 'user-action', audience: 'user' },
    )
  }

  const updateDayDiet = async (
    dayId: DayDiet['id'],
    dayDiet: NewDayDiet,
  ): Promise<void> => {
    await showPromise(
      repository.updateDayDietById(dayId, dayDiet),
      {
        loading: 'Atualizando dieta...',
        success: 'Dieta atualizada com sucesso',
        error: 'Erro ao atualizar dieta',
      },
      { context: 'user-action', audience: 'user' },
    )
  }

  const deleteDayDiet = async (dayId: DayDiet['id']): Promise<void> => {
    await showPromise(
      repository.deleteDayDietById(dayId),
      {
        loading: 'Deletando dieta...',
        success: 'Dieta deletada com sucesso',
        error: 'Erro ao deletar dieta',
      },
      { context: 'user-action', audience: 'user' },
    )
  }

  return {
    fetchTargetDay,
    fetchPreviousDayDiets,
    insertDayDiet,
    updateDayDiet,
    deleteDayDiet,
  }
}

// Default instance for production use
const defaultCrud = createCrud()

export const {
  fetchTargetDay,
  fetchPreviousDayDiets,
  insertDayDiet,
  updateDayDiet,
  deleteDayDiet,
} = defaultCrud

export { createCrud }
