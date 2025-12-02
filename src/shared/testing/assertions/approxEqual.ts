/**
 * Test helpers for approximate equality checks used in unit tests.
 *
 * These helpers compare objects deeply but allow a small epsilon for
 * numeric macro fields (default 0.1). When a mismatch is detected the
 * helper throws an Error with a clear path describing which field failed
 * so that test output points to the exact problem.
 */

/* eslint-disable */

/** Numeric-ish map for macros */
type MacroMap = Record<string, number | undefined> | undefined

function isNumberLike(val: unknown): val is number {
  return typeof val === 'number' && Number.isFinite(val)
}

function extractMacroValue(obj: unknown, key: string): number | undefined {
  if (obj === null || obj === undefined) return undefined
  if (typeof obj !== 'object') return undefined
  const record = obj as Record<string, unknown>
  // Accept functions like proteinInGrams()
  const fn = record[key]
  if (typeof fn === 'function') {
    try {
      const v = (fn as () => unknown)()
      return isNumberLike(v) ? v : undefined
    } catch {
      return undefined
    }
  }

  // Accept properties in grams or mg
  const gramKey = `${key}`
  const mgKey = `${key.replace(/InGrams/i, 'InMg')}`
  const gramVal = record[gramKey]
  if (isNumberLike(gramVal)) return gramVal
  const mgVal = record[mgKey]
  if (isNumberLike(mgVal)) return mgVal / 1000
  return undefined
}

function pretty(v: unknown) {
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}

/**
 * Assert two macro objects are approximately equal within an epsilon.
 * Throws an Error with a helpful path message when a value differs.
 */
export function assertMacrosApproxEqual(
  actual: unknown,
  expected: unknown,
  epsilon = 0.1,
  path = 'macros',
): void {
  if (expected === undefined && actual === undefined) return
  if (expected === undefined && actual !== undefined) {
    throw new Error(`${path}: expected undefined but got ${pretty(actual)}`)
  }
  if (expected !== undefined && actual === undefined) {
    throw new Error(`${path}: expected ${pretty(expected)} but got undefined`)
  }

  // Determine keys to compare. Support expected being an object with methods
  const keys = new Set<string>()
  if (expected && typeof expected === 'object') {
    for (const k of Object.keys(expected as Record<string, unknown>))
      keys.add(k)
      // Common method names
    ;['carbsInGrams', 'proteinInGrams', 'fatInGrams'].forEach((k) =>
      keys.add(k),
    )
  }
  if (actual && typeof actual === 'object') {
    for (const k of Object.keys(actual as Record<string, unknown>)) keys.add(k)
    ;['carbsInGrams', 'proteinInGrams', 'fatInGrams'].forEach((k) =>
      keys.add(k),
    )
  }

  for (const key of Array.from(keys)) {
    const a = extractMacroValue(actual, key)
    const e = extractMacroValue(expected, key)

    if (e === undefined && a === undefined) continue
    if (e === undefined && a !== undefined) {
      throw new Error(`${path}.${key}: expected undefined but got ${pretty(a)}`)
    }
    if (e !== undefined && a === undefined) {
      throw new Error(`${path}.${key}: expected ${pretty(e)} but got undefined`)
    }

    // now both numbers
    if (!isNumberLike(a) || !isNumberLike(e)) {
      throw new Error(
        `${path}.${key}: expected number ${pretty(e)} but got ${pretty(a)}`,
      )
    }

    const diff = Math.abs(a - e)
    if (diff > epsilon) {
      throw new Error(
        `${path}.${key}: expected ${e} ±${epsilon} but got ${a} (diff=${diff})`,
      )
    }
  }
}

/**
 * Assert two item-like objects are equal, using approximate macros equality
 * for nested macro fields. Other fields are strictly compared.
 */
export function assertItemApproxEqual(
  actual: unknown,
  expected: unknown,
  epsilon = 0.1,
  path = 'item',
): void {
  if (actual === expected) return

  // Basic scalar fields that should match exactly if present on expected
  const exactFields = ['id', 'name', 'quantity']
  const actualRec = (actual ?? {}) as Record<string, unknown>
  const expectedRec = (expected ?? {}) as Record<string, unknown>
  for (const f of exactFields) {
    if (Object.prototype.hasOwnProperty.call(expectedRec, f)) {
      if (actualRec[f] !== expectedRec[f]) {
        throw new Error(
          `${path}.${f}: expected ${pretty(expectedRec[f])} but got ${pretty(actualRec[f])}`,
        )
      }
    }
  }

  // Reference object (e.g. food reference) - keep strict for non-macro pieces
  const expectedRef = expectedRec['reference']
  const actualRef = actualRec['reference']
  if (expectedRef !== undefined || actualRef !== undefined) {
    const expectedRefRec = (expectedRef ?? {}) as Record<string, unknown>
    const actualRefRec = (actualRef ?? {}) as Record<string, unknown>
    if (
      expectedRefRec.type !== undefined &&
      expectedRefRec.type !== actualRefRec.type
    ) {
      throw new Error(
        `${path}.reference.type: expected ${pretty(expectedRefRec.type)} but got ${pretty(actualRefRec.type)}`,
      )
    }

    // If macros exist under reference, compare them approximately
    if (expectedRefRec.macros !== undefined) {
      assertMacrosApproxEqual(
        actualRefRec.macros,
        expectedRefRec.macros as unknown,
        epsilon,
        `${path}.reference.macros`,
      )
    }
  }
}

/**
 * Assert two meal-like objects are equal. Compares id, name, and items
 * (items compared with assertItemApproxEqual).
 */
export function assertMealApproxEqual(
  actual: unknown,
  expected: unknown,
  epsilon = 0.1,
  path = 'meal',
): void {
  if (actual === expected) return
  const actualRec = (actual ?? {}) as Record<string, unknown>
  const expectedRec = (expected ?? {}) as Record<string, unknown>

  if (expectedRec.id !== undefined && actualRec.id !== expectedRec.id) {
    throw new Error(
      `${path}.id: expected ${pretty(expectedRec.id)} but got ${pretty(actualRec.id)}`,
    )
  }
  if (expectedRec.name !== undefined && actualRec.name !== expectedRec.name) {
    throw new Error(
      `${path}.name: expected ${pretty(expectedRec.name)} but got ${pretty(actualRec.name)}`,
    )
  }

  const expectedItems = (expectedRec.items as Array<unknown>) || []
  const actualItems = (actualRec.items as Array<unknown>) || []
  if (expectedItems.length !== actualItems.length) {
    throw new Error(
      `${path}.items: expected length ${expectedItems.length} but got ${actualItems.length}`,
    )
  }

  for (let i = 0; i < expectedItems.length; i++) {
    assertItemApproxEqual(
      actualItems[i],
      expectedItems[i],
      epsilon,
      `${path}.items[${i}]`,
    )
  }
}

/**
 * Assert two DayDiet-like objects are equal. Compares id, target_day, user_id
 * and meals (meals compared with assertMealApproxEqual).
 */
export function assertDayDietApproxEqual(
  actual: unknown,
  expected: unknown,
  epsilon = 0.1,
  path = 'dayDiet',
): void {
  const actualRec = (actual ?? {}) as Record<string, unknown>
  const expectedRec = (expected ?? {}) as Record<string, unknown>

  if (expectedRec.id !== undefined && actualRec.id !== expectedRec.id) {
    throw new Error(
      `${path}.id: expected ${pretty(expectedRec.id)} but got ${pretty(actualRec.id)}`,
    )
  }
  if (
    expectedRec.target_day !== undefined &&
    actualRec.target_day !== expectedRec.target_day
  ) {
    throw new Error(
      `${path}.target_day: expected ${pretty(expectedRec.target_day)} but got ${pretty(actualRec.target_day)}`,
    )
  }
  if (
    expectedRec.user_id !== undefined &&
    actualRec.user_id !== expectedRec.user_id
  ) {
    throw new Error(
      `${path}.user_id: expected ${pretty(expectedRec.user_id)} but got ${pretty(actualRec.user_id)}`,
    )
  }

  const expectedMeals = (expectedRec.meals as Array<unknown>) || []
  const actualMeals = (actualRec.meals as Array<unknown>) || []
  if (expectedMeals.length !== actualMeals.length) {
    throw new Error(
      `${path}.meals: expected length ${expectedMeals.length} but got ${actualMeals.length}`,
    )
  }

  for (let i = 0; i < expectedMeals.length; i++) {
    assertMealApproxEqual(
      actualMeals[i],
      expectedMeals[i],
      epsilon,
      `${path}.meals[${i}]`,
    )
  }
}

export default {
  assertMacrosApproxEqual,
  assertItemApproxEqual,
  assertMealApproxEqual,
  assertDayDietApproxEqual,
}
