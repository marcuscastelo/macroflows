import { dayUseCases } from '~/modules/diet/day-diet/application/usecases/dayUseCases'
import {
  type DayDiet,
  type NewDayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { showPromise } from '~/modules/toast/application/toastManager'
import { type User } from '~/modules/user/domain/user'

function useDayCrudUseCase() {
  const fetchTargetDay = async (
    userId: User['uuid'],
    targetDay: string,
  ): Promise<void> => {
    await dayUseCases.fetchDayDietByUserIdAndTargetDay(userId, targetDay)
  }

  const fetchPreviousDayDiets = async (
    userId: User['uuid'],
    beforeDay: string,
    limit: number = 30,
  ): Promise<readonly DayDiet[]> => {
    return await dayUseCases.fetchDayDietsByUserIdBeforeDate(
      userId,
      beforeDay,
      limit,
    )
  }

  const insertDayDiet = async (dayDiet: NewDayDiet): Promise<void> => {
    await showPromise(
      dayUseCases.insertDayDiet(dayDiet),
      {
        loading: 'Criando dia de dieta...',
        success: 'Dia de dieta criado com sucesso',
        error: 'Erro ao criar dia de dieta',
      },
      { context: 'user-action' },
    )
  }

  const updateDayDiet = async (
    dayId: DayDiet['id'],
    dayDiet: NewDayDiet,
  ): Promise<void> => {
    await showPromise(
      dayUseCases.updateDayDietById(dayId, dayDiet),
      {
        loading: 'Atualizando dieta...',
        success: 'Dieta atualizada com sucesso',
        error: 'Erro ao atualizar dieta',
      },
      { context: 'user-action' },
    )
  }

  const deleteDayDiet = async (dayId: DayDiet['id']): Promise<void> => {
    await showPromise(
      dayUseCases.deleteDayDietById(dayId),
      {
        loading: 'Deletando dieta...',
        success: 'Dieta deletada com sucesso',
        error: 'Erro ao deletar dieta',
      },
      { context: 'user-action' },
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
const defaultCrud = useDayCrudUseCase()

export const {
  fetchTargetDay,
  fetchPreviousDayDiets,
  insertDayDiet,
  updateDayDiet,
  deleteDayDiet,
} = defaultCrud

export { useDayCrudUseCase as createCrud }
