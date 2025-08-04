import { Show } from 'solid-js'

import { createBlankDay } from '~/modules/diet/day-diet/application/usecases/createBlankDay'
import { currentUser } from '~/modules/user/application/user'
import { Button } from '~/sections/common/components/buttons/Button'

export function CreateBlankDayButton(props: { selectedDay: string }) {
  return (
    <Show when={currentUser()} fallback={<>Usuário não definido</>}>
      {(currentUser) => (
        <Button
          class="btn-primary w-full mt-3 rounded px-4 py-2 font-bold text-white"
          onClick={() => {
            void createBlankDay(currentUser().id, props.selectedDay)
          }}
        >
          Criar dia do zero
        </Button>
      )}
    </Show>
  )
}
