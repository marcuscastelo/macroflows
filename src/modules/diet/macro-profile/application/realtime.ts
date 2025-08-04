import { initializeMacroProfileRealtime as initializeMacroProfileRealtimeInfra } from '~/modules/diet/macro-profile/infrastructure/supabase/realtime'

let initialized = false

export function initializeMacroProfileRealtime() {
  if (initialized) {
    return
  }
  initialized = true
  initializeMacroProfileRealtimeInfra()
}
