import { createRoot } from 'solid-js'

import { initializeCachedSearchRealtime } from '~/modules/search/infrastructure/supabase/realtime'

createRoot(() => {
  initializeCachedSearchRealtime()
})
