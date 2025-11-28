import { type Accessor } from 'solid-js'

import { dayUseCases } from '~/modules/diet/day-diet/application/usecases/dayUseCases'
import {
  copyDay,
  useCopyDayUseCase,
} from '~/modules/diet/day-diet/application/usecases/useCopyDayOperations'
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
  const {
    previousDays,
    handleStartCopying,
    handleFinishCopying,
    isCopying,
    copyingDay,
    loadPreviousDays,
    resetState,
  } = useCopyDayUseCase()

  const handleCopy = (day: string) => {
    void copyDay({
      fromDay: day,
      toDay: props.selectedDay,
      previousDays: previousDays(),
      existingDay: [...previousDays(), dayUseCases.currentDayDiet()]
        .filter((d) => d !== null)
        .find((d) => d.target_day === props.selectedDay),
      onStartCopying: handleStartCopying,
      onFinishCopying: handleFinishCopying,
    })
  }

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
                previousDays={previousDays()}
                copying={isCopying()}
                copyingDay={copyingDay()}
                onCopy={handleCopy}
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
