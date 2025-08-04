import { initializeMeasureRealtime as initializeMeasureRealtimeInfra } from '~/modules/measure/infrastructure/supabase/realtime'

let initialized = false
export function initializeMeasureRealtime() {
  if (initialized) {
    return
  }
  initialized = true
  initializeMeasureRealtimeInfra()
}
