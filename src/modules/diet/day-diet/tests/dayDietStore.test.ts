import { describe, expect, it, vi } from 'vitest'

import { acceptDayChange } from '~/modules/diet/day-diet/application/dayDietUseCases'
import {
  dayChangeData,
  setDayChangeData,
  targetDay,
} from '~/modules/diet/day-diet/application/dayDietStore'
import * as dateUtils from '~/shared/utils/date/dateUtils'

describe('DayDietStore', () => {
  describe('Day Change Detection', () => {
    it('should accept day change and navigate to new day', () => {
      vi.spyOn(dateUtils, 'getTodayYYYYMMDD').mockReturnValue('2024-01-16')

      setDayChangeData({
        previousDay: '2024-01-15',
        newDay: '2024-01-16',
      })

      acceptDayChange()

      // Verify day change modal is dismissed
      expect(dayChangeData()).toBeNull()

      // Verify target day is updated to new day
      expect(targetDay()).toBe('2024-01-16')

      // Note: No showPromise call anymore - lazy loading effect handles data fetching
    })
  })
})
