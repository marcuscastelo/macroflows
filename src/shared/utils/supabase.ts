import { createClient } from '@supabase/supabase-js'
import { z } from 'zod/v4'

import env from '~/shared/config/env'
import { parseWithStack } from '~/shared/utils/parseWithStack'
const supabaseUrl = parseWithStack(
  z.string(),
  env.VITE_NEXT_PUBLIC_SUPABASE_URL,
)
const supabaseAnonKey = parseWithStack(
  z.string(),
  env.VITE_NEXT_PUBLIC_SUPABASE_ANON_KEY,
)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: true,
  },
})

export function registerSubapabaseRealtimeCallback(
  table: string,
  callback: (payload: unknown) => void,
): void {
  supabase
    .channel(table)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe()
}
