/**
 * Reserve 29 bits for the per-runtime counter, which allows more than
 * 500 million unique numeric IDs before exhaustion while keeping the final
 * value inside JavaScript's safe integer range once combined with the
 * runtime prefix.
 */
const NUMERIC_ID_COUNTER_LIMIT = 2 ** 29

/**
 * Reserve the remaining 24 safe-integer bits for a cryptographically-random
 * runtime prefix so separate execution contexts are unlikely to share the same
 * numeric ID space. Together with the counter bits above, this keeps
 * `prefix * NUMERIC_ID_COUNTER_LIMIT + counter` below `Number.MAX_SAFE_INTEGER`.
 */
const NUMERIC_ID_PREFIX_LIMIT = 2 ** 24

let numericIdCounter = 0
let numericIdPrefix: number | undefined

function getCryptoApi(): Crypto {
  if (!('crypto' in globalThis)) {
    throw new Error(
      'Crypto API is required for ID generation. Use a modern browser or Node.js runtime with Web Crypto support.',
    )
  }

  return globalThis.crypto
}

function createNumericIdPrefix(): number {
  const values = new Uint32Array(1)
  const maxUnbiasedValue =
    Math.floor(2 ** 32 / NUMERIC_ID_PREFIX_LIMIT) * NUMERIC_ID_PREFIX_LIMIT

  do {
    // Reject the top incomplete range so the modulo result stays uniform across
    // the full prefix space instead of favoring lower values.
    getCryptoApi().getRandomValues(values)
  } while (values[0]! >= maxUnbiasedValue)

  return values[0]! % NUMERIC_ID_PREFIX_LIMIT
}

function formatUuidV4(bytes: Uint8Array): string {
  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))

  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`
}

/**
 * Generates a collision-safe UUID string using the Web Crypto API.
 *
 * @returns An RFC 4122 version 4 UUID.
 */
export function generateUuid(): string {
  const cryptoApi = getCryptoApi()

  if (typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID()
  }

  const bytes = new Uint8Array(16)
  cryptoApi.getRandomValues(bytes)

  return formatUuidV4(bytes)
}

/**
 * Generates a collision-safe numeric identifier for client-side entities that
 * still require `number` IDs.
 *
 * @returns A safe integer unique for this runtime, with a cryptographically
 * random prefix to reduce cross-runtime collisions.
 */
export function generateNumericId(): number {
  if (numericIdCounter >= NUMERIC_ID_COUNTER_LIMIT) {
    throw new Error(
      'Numeric ID counter exhausted after more than 500 million IDs in one runtime. Restart the application to reset the local counter.',
    )
  }

  if (numericIdPrefix === undefined) {
    numericIdPrefix = createNumericIdPrefix()
  }

  const nextId =
    numericIdPrefix * NUMERIC_ID_COUNTER_LIMIT + numericIdCounter + 1
  numericIdCounter += 1

  return nextId
}
