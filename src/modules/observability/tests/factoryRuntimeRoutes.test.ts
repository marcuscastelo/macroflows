import { afterEach, describe, expect, it } from 'vitest'

import { GET as getBuildId } from '~/routes/build-id'
import { GET as getHealth } from '~/routes/health'

const originalCandidate = process.env.FACTORY_RUNTIME_CANDIDATE

afterEach(() => {
  if (originalCandidate === undefined) {
    delete process.env.FACTORY_RUNTIME_CANDIDATE
  } else {
    process.env.FACTORY_RUNTIME_CANDIDATE = originalCandidate
  }
})

describe('factory runtime routes', () => {
  it('reports health without external services', async () => {
    const response = getHealth()
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('ok')
  })

  it('returns the exact candidate identity', async () => {
    process.env.FACTORY_RUNTIME_CANDIDATE = 'candidate-123'
    const response = getBuildId()
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('candidate-123')
  })

  it('fails closed when no candidate identity is configured', () => {
    delete process.env.FACTORY_RUNTIME_CANDIDATE
    expect(getBuildId().status).toBe(503)
  })
})
