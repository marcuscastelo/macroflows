import { type Accessor } from 'solid-js'

import { useCases } from '~/di/useCases'
import { Button } from '~/sections/common/components/buttons/Button'
import { closeModal } from '~/shared/modal/helpers/modalHelpers'
import { dateToDDMM } from '~/shared/utils/date/dateUtils'

type DayChangeModalProps = {
  modalId: string
  newDay: Accessor<string>
  onGoToToday: () => void
  onStayOnDay: () => void
}

export function DayChangeModal(props: DayChangeModalProps) {
  const previousDate = () => {
    const [year, month, day] = useCases
      .dayUseCases()
      .targetDay()
      .split('-')
      .map(Number)
    return new Date(year!, month! - 1, day)
  }
  const formattedPreviousDay = () => dateToDDMM(previousDate())

  const newDate = () => {
    const [year, month, day] = props.newDay().split('-').map(Number)
    return new Date(year!, month! - 1, day)
  }
  const formattedNewDay = () => dateToDDMM(newDate())

  const handleGoToToday = () => {
    props.onGoToToday()
    closeModal(props.modalId)
  }

  const handleStayOnDay = () => {
    props.onStayOnDay()
    closeModal(props.modalId)
  }

  return (
    <div class="flex flex-col gap-4">
      <h2 class="text-lg font-bold">Dia alterado</h2>
      <p class="text-gray-300">
        O dia mudou. Deseja ir para hoje ou continuar visualizando{' '}
        <span class="font-medium text-white">{formattedPreviousDay()}</span>?
      </p>
      <div class="flex gap-3 mt-4">
        <Button type="button" onClick={handleStayOnDay} class="flex-1 ">
          Continuar em {formattedPreviousDay()}
        </Button>
        <Button
          type="button"
          onClick={handleGoToToday}
          class="flex-1 btn-primary"
        >
          Ir para {formattedNewDay()} (Hoje)
        </Button>
      </div>
    </div>
  )
}
