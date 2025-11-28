import { type Accessor } from 'solid-js'

import { useCopyDayOperations } from '~/modules/diet/day-diet/application/usecases/copyDayOperations'
import { currentDayDiet } from '~/modules/diet/day-diet/application/usecases/dayState'
import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { currentUserId } from '~/modules/user/application/user'
import { Button } from '~/sections/common/components/buttons/Button'
import {
  closeModal,
  openContentModal,
} from '~/shared/modal/helpers/modalHelpers'
import { lazyImport } from '~/shared/solid/lazyImport'

const { CopyLastDayModal } = lazyImport(
  () => import('~/sections/day-diet/components/CopyLastDayModal'),
  ['CopyLastDayModal'],
)

export function CopyLastDayButton(props: {
  dayDiet: Accessor<DayDiet | undefined>
  selectedDay: string
}) {
  const { state, copyDay, loadPreviousDays, resetState } =
    useCopyDayOperations()

  return (
    <>
      <Button
        class="btn-primary w-full mt-3 rounded px-4 py-2 font-bold text-white"
        onClick={() => {
          const userId = currentUserId()

          void loadPreviousDays(userId, props.selectedDay)

          openContentModal(
            (modalId) => (
              <CopyLastDayModal
                previousDays={state().previousDays}
                copying={state().isCopying}
                copyingDay={state().copyingDay}
                onCopy={(day) => {
                  void copyDay({
                    fromDay: day,
                    toDay: props.selectedDay,
                    previousDays: state().previousDays,
                    existingDay: [...state().previousDays, currentDayDiet()]
                      .filter((d) => d !== null)
                      .find((d) => d.target_day === props.selectedDay),
                  })
                }}
                onClose={() => {
                  resetState()
                  closeModal(modalId)
                }}
              />
            ),
            {
              title: 'Copiar dia anterior',
            },
          )
        }}
      >
        Copiar dia anterior
      </Button>
    </>
  )
}
