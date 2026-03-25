import {
  type DayDiet,
  type NewDayDiet,
  promoteDayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { type DayGateway } from '~/modules/diet/day-diet/domain/dayDietGateway'
import { type User } from '~/modules/user/domain/user'
import {
  getGuestDatabase,
  updateGuestDatabase,
} from '~/shared/guest/guestDatabase'
import { logging } from '~/shared/utils/logging'

let nextDayId = 10000

function generateDayId(): number {
  return nextDayId++
}

/**
 * Creates a guest day gateway that uses the in-memory guest database
 */
export function createGuestDayGateway(): DayGateway {
  return {
    fetchDayDietByUserIdAndTargetDay,
    fetchDayDietsByUserIdBeforeDate,
    fetchDayDietById,
    insertDayDiet,
    updateDayDietById,
    deleteDayDietById,
  }
}

async function fetchDayDietById(dayId: DayDiet['id']): Promise<DayDiet | null> {
  const db = getGuestDatabase()
  const dayDiet = db.dayDiets.find((d) => d.id === dayId)
  logging.debug('[guestDayGateway] fetchDayDietById', {
    dayId,
    found: !!dayDiet,
  })
  return dayDiet ?? null
}

async function fetchDayDietByUserIdAndTargetDay(
  userId: User['uuid'],
  targetDay: string,
): Promise<DayDiet | null> {
  const db = getGuestDatabase()
  const dayDiet = db.dayDiets.find(
    (d) => d.user_id === userId && d.target_day === targetDay,
  )
  logging.debug('[guestDayGateway] fetchDayDietByUserIdAndTargetDay', {
    userId,
    targetDay,
    found: !!dayDiet,
  })
  return dayDiet ?? null
}

async function fetchDayDietsByUserIdBeforeDate(
  userId: User['uuid'],
  beforeDay: string,
  limit: number = 30,
): Promise<readonly DayDiet[]> {
  const db = getGuestDatabase()
  const dayDiets = db.dayDiets
    .filter((d) => d.user_id === userId && d.target_day < beforeDay)
    .sort((a, b) => b.target_day.localeCompare(a.target_day))
    .slice(0, limit)
  logging.debug('[guestDayGateway] fetchDayDietsByUserIdBeforeDate', {
    userId,
    beforeDay,
    count: dayDiets.length,
  })
  return dayDiets
}

async function insertDayDiet(newDay: NewDayDiet): Promise<DayDiet> {
  const dayDiet = promoteDayDiet(newDay, { id: generateDayId() })

  updateGuestDatabase((db) => ({
    ...db,
    dayDiets: [...db.dayDiets, dayDiet],
  }))

  logging.debug('[guestDayGateway] insertDayDiet', { dayDiet })
  return dayDiet
}

async function updateDayDietById(
  id: DayDiet['id'],
  newDay: NewDayDiet,
): Promise<DayDiet | null> {
  let updatedDayDiet: DayDiet | null = null

  updateGuestDatabase((db) => ({
    ...db,
    dayDiets: db.dayDiets.map((d) => {
      if (d.id === id) {
        updatedDayDiet = { ...newDay, id, __type: 'DayDiet' }
        return updatedDayDiet
      }
      return d
    }),
  }))

  logging.debug('[guestDayGateway] updateDayDietById', { id, updatedDayDiet })
  return updatedDayDiet
}

async function deleteDayDietById(id: DayDiet['id']): Promise<void> {
  updateGuestDatabase((db) => ({
    ...db,
    dayDiets: db.dayDiets.filter((d) => d.id !== id),
  }))

  logging.debug('[guestDayGateway] deleteDayDietById', { id })
}
