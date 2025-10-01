import { type Setter } from 'solid-js'

import { logging } from '~/shared/utils/logging'

export function createTargetDayResetService(deps: {
  getTodayYYYYMMDD: () => string
  setTargetDay: Setter<string>
}) {
  return () => {
    logging.debug(`Effect - Reset to today!`)
    const today = deps.getTodayYYYYMMDD()
    deps.setTargetDay(today)
  }
}
