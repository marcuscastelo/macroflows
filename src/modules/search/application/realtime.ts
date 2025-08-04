import { initializeCachedSearchRealtime as initializeCachedSearchRealtimeInfra } from '~/modules/search/infrastructure/supabase/realtime'

let initialized = false
export function initializeCachedSearchRealtime() {
  if (initialized) {
    return
  }
  initialized = true
  initializeCachedSearchRealtimeInfra()
}
