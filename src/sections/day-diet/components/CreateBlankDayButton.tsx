import { Show } from 'solid-js'

import { useContainer } from '~/di/container'
import { createCreateBlankDay } from '~/modules/diet/day-diet/application/usecases/createBlankDay'
import { Button } from '~/sections/common/components/buttons/Button'

export function CreateBlankDayButton(props: { selectedDay: string }) {
  const useCases = useContainer()
  const createBlankDay = createCreateBlankDay({
    dayUseCases: () => useCases.dayUseCases(),
  })
  const userUseCases = useCases.userUseCases()
  return (
    <Show
      when={userUseCases.currentUser()}
      fallback={<>Usuário não definido</>}
    >
      {(currentUser) => (
        <Button
          class="btn-primary w-full mt-3 rounded px-4 py-2 font-bold text-white"
          onClick={() => {
            void createBlankDay(currentUser().uuid, props.selectedDay)
          }}
        >
          Criar dia do zero
        </Button>
      )}
    </Show>
  )
}
