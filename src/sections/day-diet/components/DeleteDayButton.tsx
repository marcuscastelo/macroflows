import { type Accessor } from 'solid-js'

import { deleteDayDiet } from '~/modules/diet/day-diet/application/usecases/dayCrud'
import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { Button } from '~/sections/common/components/buttons/Button'
import { openConfirmModal } from '~/shared/modal/helpers/modalHelpers'
import { logging } from '~/shared/utils/logging'

export function DeleteDayButton(props: { day: Accessor<DayDiet> }) {
  return (
    <Button
      class="btn-error mt-3 min-w-full rounded px-4 py-2 font-bold text-white hover:bg-red-400"
      onClick={() => {
        openConfirmModal('Tem certeza que deseja excluir este dia?', {
          title: 'Excluir dia',
          confirmText: 'Excluir dia',
          cancelText: 'Cancelar',
          onConfirm: () => {
            deleteDayDiet(props.day().id).catch((error) => {
              logging.error('DeleteDayButton error:', error)
              throw error
            })
          },
        })
      }}
    >
      PERIGO: Excluir dia
    </Button>
  )
}
