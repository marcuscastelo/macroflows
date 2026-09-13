import { beforeEach, describe, expect, it } from 'vitest'

import { createNewDayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { createDefaultMeals } from '~/modules/diet/day-diet/domain/defaultMeals'
import { createGuestDayGateway } from '~/modules/diet/day-diet/infrastructure/guest/guestDayGateway'
import {
  getGuestDatabase,
  resetGuestDatabase,
} from '~/shared/guest/guestDatabase'

describe('guestDayGateway.insertDayDiet', () => {
  beforeEach(() => {
    resetGuestDatabase()
  })

  it('returns the created day diet and persists it', async () => {
    const gateway = createGuestDayGateway()
    const userId = getGuestDatabase().user.uuid
    const newDayDiet = createNewDayDiet({
      target_day: '2099-01-02',
      user_id: userId,
      meals: createDefaultMeals(),
    })

    const insertedDayDiet = await gateway.insertDayDiet(newDayDiet)

    expect(insertedDayDiet).toMatchObject({
      target_day: '2099-01-02',
      user_id: userId,
      __type: 'DayDiet',
    })
    expect(typeof insertedDayDiet.id).toBe('number')
    expect(
      getGuestDatabase().dayDiets.some((day) => day.id === insertedDayDiet.id),
    ).toBe(true)
  })
})
