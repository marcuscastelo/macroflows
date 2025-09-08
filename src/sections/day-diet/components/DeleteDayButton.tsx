import { type Accessor } from 'solid-js'

import { deleteDayDiet } from '~/modules/diet/day-diet/application/usecases/dayCrud'
import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { Button } from '~/sections/common/components/buttons/Button'
import { openConfirmModal } from '~/shared/modal/helpers/modalHelpers'

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
              import('~/shared/error/errorHandler')
                .then(({ createErrorHandler }) => {
                  const errorHandler = createErrorHandler(
                    'user',
                    'DeleteDayButton',
                  )
                  errorHandler.apiError(error, { operation: 'delete day' })
                })
                .catch(() => {
                  // Fallback if import fails
                })
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
