import { Show } from 'solid-js'

import { createBlankDay } from '~/modules/diet/day-diet/application/usecases/createBlankDay'
import { userUseCases } from '~/modules/user/application/usecases/userUseCases'
import { Button } from '~/sections/common/components/buttons/Button'

export function CreateBlankDayButton(props: { selectedDay: string }) {
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
