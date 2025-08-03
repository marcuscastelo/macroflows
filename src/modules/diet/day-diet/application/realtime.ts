import { untrack } from 'solid-js'

import { dayDietStore } from '~/modules/diet/day-diet/application/dayDietStore'
import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { setupDayDietRealtimeSubscription } from '~/modules/diet/day-diet/infrastructure/supabase/realtime'

/**
 * When realtime day diets change, apply granular cache updates
 */
setupDayDietRealtimeSubscription((event) => {
  console.log(`[dayDiet] Real-time ${event.eventType}:`, event)

  // Avoid reactive reads in non-tracked scope - get current state directly
  const existingDays = untrack(() => dayDietStore.dayDiets())

  switch (event.eventType) {
    case 'INSERT': {
      if (event.new) {
        // Add new day to cache (sorted insertion)
        const existingIndex = existingDays.findIndex(
          (day: DayDiet) => day.target_day === event.new!.target_day,
        )
        if (existingIndex < 0) {
          const updatedDays = [...existingDays, event.new].sort((a, b) =>
            a.target_day.localeCompare(b.target_day),
          )
          dayDietStore.setDayDiets(updatedDays)
        }

        // Update current day diet if it matches target day
        const currentTargetDay = untrack(() => dayDietStore.targetDay())
        if (event.new.target_day === currentTargetDay) {
          dayDietStore.setCurrentDayDiet(event.new)
        }
      }
      break
    }

    case 'UPDATE': {
      if (event.new) {
        // Update existing day in cache
        const existingIndex = existingDays.findIndex(
          (day: DayDiet) => day.id === event.new!.id,
        )
        if (existingIndex >= 0) {
          const updatedDays = [...existingDays]
          updatedDays[existingIndex] = event.new
          dayDietStore.setDayDiets(updatedDays)

          // Update current day diet if it matches target day
          const currentTargetDay = untrack(() => dayDietStore.targetDay())
          if (event.new.target_day === currentTargetDay) {
            dayDietStore.setCurrentDayDiet(event.new)
          }
        }
      }
      break
    }

    case 'DELETE': {
      if (event.old) {
        // Remove deleted day from cache
        const updatedDays = existingDays.filter(
          (day: DayDiet) => day.id !== event.old!.id,
        )
        dayDietStore.setDayDiets(updatedDays)

        // Clear current day diet if it was the deleted day
        const currentTargetDay = untrack(() => dayDietStore.targetDay())
        if (event.old.target_day === currentTargetDay) {
          dayDietStore.setCurrentDayDiet(null)
          // Lazy loading effect will handle fetching if day still exists
        }
      }
      break
    }
  }
})
