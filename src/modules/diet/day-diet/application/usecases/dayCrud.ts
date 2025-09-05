import {
  type DayDiet,
  type NewDayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { createDayDietRepository } from '~/modules/diet/day-diet/infrastructure/dayDietRepository'
import { showPromise } from '~/modules/toast/application/toastManager'
import { type User } from '~/modules/user/domain/user'

const dayRepository = createDayDietRepository()

export async function fetchTargetDay(
  userId: User['id'],
  targetDay: string,
): Promise<void> {
  await dayRepository.fetchDayDietByUserIdAndTargetDay(userId, targetDay)
}

export async function fetchPreviousDayDiets(
  userId: User['id'],
  beforeDay: string,
  limit: number = 30,
): Promise<readonly DayDiet[]> {
  return await dayRepository.fetchDayDietsByUserIdBeforeDate(
    userId,
    beforeDay,
    limit,
  )
}

export async function insertDayDiet(dayDiet: NewDayDiet): Promise<void> {
  await showPromise(
    dayRepository.insertDayDiet(dayDiet),
    {
      loading: 'Criando dia de dieta...',
      success: 'Dia de dieta criado com sucesso',
      error: 'Erro ao criar dia de dieta',
    },
    { context: 'user-action' },
  )
}

export async function updateDayDiet(
  dayId: DayDiet['id'],
  dayDiet: NewDayDiet,
): Promise<void> {
  await showPromise(
    dayRepository.updateDayDietById(dayId, dayDiet),
    {
      loading: 'Atualizando dieta...',
      success: 'Dieta atualizada com sucesso',
      error: 'Erro ao atualizar dieta',
    },
    { context: 'user-action' },
  )
}

export async function deleteDayDiet(dayId: DayDiet['id']): Promise<void> {
  await showPromise(
    dayRepository.deleteDayDietById(dayId),
    {
      loading: 'Deletando dieta...',
      success: 'Dieta deletada com sucesso',
      error: 'Erro ao deletar dieta',
    },
    { context: 'user-action' },
  )
}
