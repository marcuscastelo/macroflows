import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { composeNumericId } from '~/shared/utils/uniqueId'

let previousCrypto: Crypto | undefined

describe('composeNumericId', () => {
  it('keeps the largest possible numeric ID within the safe integer range', () => {
    const maxPrefix = 2 ** 24 - 1
    const maxCounter = 2 ** 29 - 1

    const numericId = composeNumericId(maxPrefix, maxCounter)

    expect(numericId).toBe(Number.MAX_SAFE_INTEGER)
    expect(Number.isSafeInteger(numericId)).toBe(true)
  })

  it('allows zero as the first numeric ID', () => {
    expect(composeNumericId(0, 0)).toBe(0)
  })
})

describe('generateNumericId', () => {
  beforeEach(() => {
    previousCrypto = globalThis.crypto
    vi.resetModules()

    const cryptoStub: Pick<Crypto, 'getRandomValues' | 'randomUUID'> = {
      getRandomValues: <T extends ArrayBufferView>(values: T): T => {
        if (values instanceof Uint32Array) {
          values[0] = 2 ** 24 - 1
        }

        return values
      },
      randomUUID: vi.fn(),
    }

    vi.stubGlobal('crypto', cryptoStub)
  })

  afterEach(() => {
    if (previousCrypto === undefined) {
      Reflect.deleteProperty(globalThis, 'crypto')
    } else {
      vi.stubGlobal('crypto', previousCrypto)
    }

    vi.resetModules()
  })

  it('uses a zero-based counter for generated values', async () => {
    const { generateNumericId } = await import('~/shared/utils/uniqueId')
    const maxPrefix = 2 ** 24 - 1

    const firstId = generateNumericId()
    const secondId = generateNumericId()

    expect(firstId).toBe(composeNumericId(maxPrefix, 0))
    expect(secondId).toBe(firstId + 1)
    expect(Number.isSafeInteger(firstId)).toBe(true)
    expect(Number.isSafeInteger(secondId)).toBe(true)
  })
})
