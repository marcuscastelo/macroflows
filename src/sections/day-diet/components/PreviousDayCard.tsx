import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { DayDietExt } from '~/modules/diet/day-diet/domain/dayDietExt'
import { PreviousDayCardActions } from '~/sections/day-diet/components/PreviousDayCardActions'
import PreviousDayDetailsModal from '~/sections/day-diet/components/PreviousDayDetailsModal'
import MacroNutrientsView from '~/sections/macro-nutrients/components/MacroNutrientsView'
import { openContentModal } from '~/shared/modal/helpers/modalHelpers'

type PreviousDayCardProps = {
  dayDiet: DayDiet
  copying: boolean
  copyingDay: string | null
  onCopy: (day: string) => void
}

export function PreviousDayCard(props: PreviousDayCardProps) {
  const macros = () => DayDietExt.of(props.dayDiet).macros()
  const calories = () => macros().calories()

  const normalizedDate = () => {
    return new Date(props.dayDiet.target_day + 'T00:00:00') // Force UTC interpretation
  }

  return (
    <div class="border rounded p-3 flex flex-col gap-2">
      <div class="flex justify-between">
        <div class="font-semibold">
          {normalizedDate().toLocaleDateString('en-GB')}
        </div>
        <div class="flex gap-2 text-sm text-gray-600 justify-between px-2 items-center">
          <div>
            <MacroNutrientsView macros={macros().value} />
          </div>
          <span class="ml-2 text-sm text-white">
            {calories().toFixed(2)} kcal
          </span>
        </div>
      </div>
      <PreviousDayCardActions
        dayDiet={props.dayDiet}
        copying={props.copying}
        copyingDay={props.copyingDay}
        onShowDetails={() => {
          openContentModal(
            () => <PreviousDayDetailsModal dayDiet={props.dayDiet} />,
            {
              title: 'Resumo do dia',
              closeOnOutsideClick: true,
            },
          )
        }}
        onCopy={props.onCopy}
      />
    </div>
  )
}
