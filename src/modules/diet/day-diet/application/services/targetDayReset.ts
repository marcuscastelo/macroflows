import { type Setter } from 'solid-js'

import { createDebug } from '~/shared/utils/createDebug'

const debug = createDebug()

export function createTargetDayResetService(deps: {
  getTodayYYYYMMDD: () => string
  setTargetDay: Setter<string>
}) {
  return () => {
    debug(`Effect - Reset to today!`)
    const today = deps.getTodayYYYYMMDD()
    deps.setTargetDay(today)
  }
}
