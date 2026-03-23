import { createEffect, createSignal, onCleanup, Show, Suspense } from 'solid-js'

import { useContainer } from '~/di/container'
import { AuthGuard } from '~/modules/auth/ui/guards/AuthGuard'
import { Alert } from '~/sections/common/components/Alert'
import { LoadingRing } from '~/sections/common/components/LoadingRing'
import { PageLoading } from '~/sections/common/components/PageLoading'
import { DayChangeModal } from '~/sections/day-diet/components/DayChangeModal'
import DayMacros from '~/sections/day-diet/components/DayMacros'
import DayMeals from '~/sections/day-diet/components/DayMeals'
import DayNotFound from '~/sections/day-diet/components/DayNotFound'
import TopBar from '~/sections/day-diet/components/TopBar'
import {
  closeModal,
  openContentModal,
} from '~/shared/modal/helpers/modalHelpers'

export default function DietPage() {
  const useCases = useContainer()
  const [mode, setMode] = createSignal<'edit' | 'read-only' | 'summary'>('edit')

  function handleRequestEditMode() {
    setMode('edit')
  }

  createEffect(() => {
    setMode(
      useCases.dayUseCases().targetDay() ===
        useCases.dayUseCases().currentToday()
        ? 'edit'
        : 'read-only',
    )
  })

  // Show day change modal when day changes
  createEffect(() => {
    const changeData = useCases.dayUseCases().dayChangeData()
    if (changeData) {
      let modalId = openContentModal(
        (modalId) => (
          <DayChangeModal
            modalId={modalId}
            newDay={useCases.dayUseCases().currentToday}
            onGoToToday={useCases.dayUseCases().acceptDayChange}
            onStayOnDay={useCases.dayUseCases().dismissDayChangeModal}
          />
        ),
        {
          closeOnOutsideClick: false,
          closeOnEscape: true,
          showCloseButton: false,
        },
      )

      onCleanup(() => {
        closeModal(modalId)
      })
    }
  })

  return (
    <AuthGuard>
      <Suspense fallback={<PageLoading message="Carregando dieta do dia..." />}>
        <TopBar />
        <Show when={useCases.dayUseCases().currentDayDiet()} fallback={<div />}>
          {(currentDayDiet) => (
            <DayMacros dayDiet={currentDayDiet()} class="mb-4" />
          )}
        </Show>
        {mode() !== 'edit' && (
          <Alert class="mt-2" color="yellow">
            Mostrando refeições do dia {useCases.dayUseCases().targetDay()}!
          </Alert>
        )}
        <Show
          when={useCases.dayUseCases().currentDayDiet()}
          fallback={
            <DayNotFound selectedDay={useCases.dayUseCases().targetDay()} />
          }
        >
          {(currentDayDiet) => (
            <Suspense fallback={<LoadingRing />}>
              <DayMeals
                dayDiet={currentDayDiet()}
                selectedDay={useCases.dayUseCases().targetDay()}
                mode={mode()}
                onRequestEditMode={handleRequestEditMode}
              />
            </Suspense>
          )}
        </Show>
      </Suspense>
    </AuthGuard>
  )
}
