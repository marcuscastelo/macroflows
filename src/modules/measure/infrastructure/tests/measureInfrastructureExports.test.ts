import { describe, expect, it } from 'vitest'

import * as measureRepositoryModule from '~/modules/measure/infrastructure/measureRepository'
import * as realtimeModule from '~/modules/measure/infrastructure/supabase/realtime'
import * as gatewayModule from '~/modules/measure/infrastructure/supabase/supabaseBodyMeasureGateway'

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

  it('keeps realtime exports limited to the public factory', () => {
    expect(Object.keys(realtimeModule)).toEqual([
      'createMeasureRealtimeService',
    ])
  })

  it('creates a realtime service with the public initializer', () => {
    expect(Object.keys(realtimeModule.createMeasureRealtimeService())).toEqual([
      'initializeMeasureRealtime',
    ])
  })
})
