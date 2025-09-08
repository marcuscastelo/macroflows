import { createClient } from '@supabase/supabase-js'
import { z } from 'zod/v4'

import env from '~/shared/config/env'
import { type Database } from '~/shared/supabase/database.types'
import { logging } from '~/shared/utils/logging'
import { parseWithStack } from '~/shared/utils/parseWithStack'

const supabaseUrl = parseWithStack(
  z.string(),
  env.VITE_NEXT_PUBLIC_SUPABASE_URL,
)

const supabaseAnonKey = parseWithStack(
  z.string(),
  env.VITE_NEXT_PUBLIC_SUPABASE_ANON_KEY,
)

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: true,
  },
})

export type RealtimeEvent<T = unknown> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  old?: T
  new?: T
}

export function registerSubapabaseRealtimeCallback<T>(
  table: string,
  validator: z.ZodType<T>,
  callback: (payload: RealtimeEvent<T>) => void,
): void {
  const handleCallback = (payload: unknown) => {
    logging.debug(`SUPABASE_REALTIME - ${table} -> payload=`, { payload })
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const payloadData = payload as {
      eventType: 'INSERT' | 'UPDATE' | 'DELETE'
      old?: unknown
      new?: unknown
    }

    const eventType = payloadData.eventType

    const oldRecord =
      payloadData.old !== null ? validator.safeParse(payloadData.old) : null

    const newRecord =
      payloadData.new !== null ? validator.safeParse(payloadData.new) : null

    callback({
      eventType,
      old: oldRecord !== null && oldRecord.success ? oldRecord.data : undefined,
      new: newRecord !== null && newRecord.success ? newRecord.data : undefined,
    })
  }

  supabase
    .channel(table)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      handleCallback,
    )
    .subscribe()
}
