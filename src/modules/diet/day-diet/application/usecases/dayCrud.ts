import {
  type DayDiet,
  type NewDayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { createDayDietRepository } from '~/modules/diet/day-diet/infrastructure/dayDietRepository'
import { showPromise } from '~/modules/toast/application/toastManager'
import { type User } from '~/modules/user/domain/user'
import { withSpan } from '~/shared/utils/tracing'

function createCrud(repository = createDayDietRepository()) {
  const fetchTargetDay = async (
    userId: User['id'],
    targetDay: string,
  ): Promise<void> => {
    await withSpan('day_diet.fetch_target', async (span) => {
      span.setAttributes({
        'user.id': userId,
        'day_diet.target_day': targetDay,
        'operation.type': 'fetch_target_day',
      })

      await repository.fetchDayDietByUserIdAndTargetDay(userId, targetDay)
      span.addEvent('target_day_fetched', { userId, targetDay })
    })
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
    await withSpan('day_diet.insert', async (span) => {
      span.setAttributes({
        'user.id': dayDiet.owner,
        'day_diet.target_day': dayDiet.target_day,
        'operation.type': 'insert_day_diet',
      })

      await showPromise(
        repository.insertDayDiet(dayDiet),
        {
          loading: 'Criando dia de dieta...',
          success: 'Dia de dieta criado com sucesso',
          error: 'Erro ao criar dia de dieta',
        },
        { context: 'user-action' },
      )

      span.addEvent('day_diet_insert_completed', {
        userId: dayDiet.owner,
        targetDay: dayDiet.target_day,
      })
    })
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
      { context: 'user-action' },
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
const defaultCrud = createCrud()

export const {
  fetchTargetDay,
  fetchPreviousDayDiets,
  insertDayDiet,
  updateDayDiet,
  deleteDayDiet,
} = defaultCrud

export { createCrud }
