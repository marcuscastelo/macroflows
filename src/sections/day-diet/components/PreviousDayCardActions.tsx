import { dayUseCases } from '~/modules/diet/day-diet/application/usecases/dayUseCases'
import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { openConfirmModal } from '~/shared/modal/helpers/modalHelpers'
import { getTodayYYYYMMDD } from '~/shared/utils/date/dateUtils'

type PreviousDayCardActionsProps = {
  dayDiet: DayDiet
  copying: boolean
  copyingDay: string | null
  onShowDetails: () => void
  onCopy: (day: string) => void
}

export function PreviousDayCardActions(props: PreviousDayCardActionsProps) {
  const handleCopy = (day: string) => {
    const meals =
      dayUseCases
        .currentDayDiet()
        ?.meals.filter((meal) => meal.items.length > 0).length ?? 0
    if (meals === 0) {
      props.onCopy(day)
      return
    }

    openConfirmModal(
      `SUBSTITUIR ${meals} refeiç${meals > 1 ? 'ões' : 'ão'} do dia ${getTodayYYYYMMDD()} com as refeições do dia ${day}?`,
      {
        title: `Copiar refeições ${day} -> ${getTodayYYYYMMDD()}`,
        confirmText: 'Copiar',
        cancelText: 'Cancelar',
        onConfirm: () => props.onCopy(day),
      },
    )
  }

  return (
    <div class="flex gap-3">
      <button
        class="btn-secondary btn flex-1"
        onClick={() => props.onShowDetails()}
      >
        Ver dia
      </button>
      <button
        class="btn-primary btn flex-1"
        disabled={
          props.copying && props.copyingDay === props.dayDiet.target_day
        }
        onClick={() => handleCopy(props.dayDiet.target_day)}
      >
        {props.copying && props.copyingDay === props.dayDiet.target_day
          ? 'Copiando...'
          : 'Copiar para Hoje'}
      </button>
    </div>
  )
}
