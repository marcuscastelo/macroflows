import { describe, expect, it, vi } from 'vitest'

import {
  acceptDayChange,
  dayChangeData,
  setDayChangeData,
} from '~/modules/diet/day-diet/application/dayDiet'
import * as toastManager from '~/modules/toast/application/toastManager'
import * as user from '~/modules/user/application/user'
import * as dateUtils from '~/shared/utils/date/dateUtils'

describe('Day Change Detection', () => {
  it('should accept day change and navigate to new day', () => {
    vi.spyOn(dateUtils, 'getTodayYYYYMMDD').mockReturnValue('2024-01-16')
    vi.spyOn(toastManager, 'showPromise').mockResolvedValue([])
    vi.spyOn(user, 'currentUserId').mockReturnValue(1)

    setDayChangeData({
      previousDay: '2024-01-15',
      newDay: '2024-01-16',
    })

    acceptDayChange()

    expect(dayChangeData()).toBeNull()
    expect(toastManager.showPromise).toHaveBeenCalled()
  })
})
