import { initializeDayDietRealtime as initializeDayDietRealtimeInfra } from '~/modules/diet/day-diet/infrastructure/supabase/realtime'

let initialized = false
export function initializeDayDietRealtime() {
  if (initialized) {
    return
  }
  initialized = true
  initializeDayDietRealtimeInfra()
}
