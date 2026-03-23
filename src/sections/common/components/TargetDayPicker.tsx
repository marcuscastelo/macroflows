import { Suspense } from 'solid-js'

import { useContainer } from '~/di/container'
import { type DateValueType } from '~/sections/datepicker/types'
import { lazyImport } from '~/shared/solid/lazyImport'
import {
  dateToYYYYMMDD,
  getTodayYYYYMMDD,
  stringToDate,
} from '~/shared/utils/date/dateUtils'

const { Datepicker } = lazyImport(
  () => import('~/sections/datepicker/components/Datepicker'),
)

export function TargetDayPicker() {
  const useCases = useContainer()
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
      dayString = dateToYYYYMMDD(date)
    }

    useCases.dayUseCases().setTargetDay(dayString)
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
            startDate: useCases.dayUseCases().targetDay(),
            endDate: useCases.dayUseCases().targetDay(),
          },
        ]}
        value={{
          startDate: useCases.dayUseCases().targetDay(),
          endDate: useCases.dayUseCases().targetDay(),
        }}
        onChange={handleDayChange}
      />
    </Suspense>
  )
}
