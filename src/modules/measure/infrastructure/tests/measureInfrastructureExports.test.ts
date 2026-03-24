import { describe, expect, it } from 'vitest'

import * as measureRepositoryModule from '~/modules/measure/infrastructure/measureRepository'
import * as realtimeModule from '~/modules/measure/infrastructure/supabase/realtime'
import * as gatewayModule from '~/modules/measure/infrastructure/supabase/supabaseBodyMeasureGateway'
import * as mapperModule from '~/modules/measure/infrastructure/supabase/supabaseMeasureMapper'

describe('measure infrastructure module exports', () => {
  it('exports only the measure repository factory', () => {
    expect(Object.keys(measureRepositoryModule)).toEqual([
      'createMeasureRepository',
    ])
  })

  it('exports only the Supabase gateway factory', () => {
    expect(Object.keys(gatewayModule)).toEqual([
      'createSupabaseBodyMeasureGateway',
    ])
  })

  it('exports only the Supabase mapper factory', () => {
    expect(Object.keys(mapperModule)).toEqual([
      'createSupabaseBodyMeasureMapper',
    ])
  })

  it('keeps realtime exports limited to the public initializer', () => {
    expect(Object.keys(realtimeModule)).toEqual(['initializeMeasureRealtime'])
  })
})
