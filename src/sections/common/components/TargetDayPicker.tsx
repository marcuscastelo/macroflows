import { Suspense } from 'solid-js'

import {
  setTargetDay,
  targetDay,
} from '~/modules/diet/day-diet/application/dayDietUseCases'
import { type DateValueType } from '~/sections/datepicker/types'
import { lazyImport } from '~/shared/solid/lazyImport'
import { getTodayYYYYMMDD, stringToDate } from '~/shared/utils/date/dateUtils'

const { Datepicker } = lazyImport(
  () => import('~/sections/datepicker/components/Datepicker'),
)

export function TargetDayPicker() {
  const handleDayChange = (
    newValue: DateValueType,
    element?: HTMLInputElement | null,
  ) => {
    let dayString: string = getTodayYYYYMMDD()
    if (newValue === null || newValue.startDate === null) {
      dayString = getTodayYYYYMMDD()
    } else {
      const dateString = newValue.startDate
      const date = stringToDate(dateString)
      dayString = date.toISOString().split('T')[0]! // TODO:   use dateUtils when this is understood
    }

    setTargetDay(dayString)
    if (element) {
      element.blur() // Remove focus from the datepicker input
      element.value = dayString // Update the input value
    }
  }

  return (
    <Suspense>
      <Datepicker
        asSingle={true}
        useRange={false}
        readOnly={true}
        displayFormat="DD/MM/YYYY"
        disabledDates={[
          // targetDay(), future days are disabled
          {
            startDate: targetDay(),
            endDate: targetDay(),
          },
        ]}
        value={{
          startDate: targetDay(),
          endDate: targetDay(),
        }}
        onChange={handleDayChange}
      />
    </Suspense>
  )
}
