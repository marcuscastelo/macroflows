import { For, Show } from 'solid-js'

import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { lazyImport } from '~/shared/solid/lazyImport'

const { PreviousDayCard } = lazyImport(
  () => import('~/sections/day-diet/components/PreviousDayCard'),
  ['PreviousDayCard'],
)

type CopyLastDayModalProps = {
  previousDays: readonly DayDiet[]
  copying: boolean
  copyingDay: string | null
  onCopy: (day: string) => void
  onClose: () => void
}

export function CopyLastDayModal(props: CopyLastDayModalProps) {
  return (
    <div class="flex flex-col gap-4 min-h-[500px]">
      <h2 class="text-lg font-bold">Selecione um dia anterior para copiar</h2>
      <Show
        when={props.previousDays.length > 0}
        fallback={
          <div class="text-gray-500">
            Nenhum dia com dieta registrada disponível para copiar.
          </div>
        }
      >
        <div class="flex flex-col gap-4 max-h-96 overflow-y-auto">
          <For each={props.previousDays}>
            {(dayDiet) => (
              <PreviousDayCard
                dayDiet={dayDiet}
                copying={props.copying}
                copyingDay={props.copyingDay}
                onCopy={(day) => {
                  props.onCopy(day)
                  props.onClose()
                }}
              />
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
