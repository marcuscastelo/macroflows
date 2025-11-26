import type { BodyMeasure } from '~/modules/measure/domain/measure'
import type { Weight } from '~/modules/weight/domain/weight/weight'
import type { BodyFatInput } from '~/shared/utils/bfMath'
import { calculateBodyFat } from '~/shared/utils/bfMath'
import { dateToYYYYMMDD } from '~/shared/utils/date/dateUtils'

/**
 * Groups body measures by date string (YYYY-MM-DD format).
 * @param measures - Array of body measures to group
 * @returns Record with date strings as keys and arrays of measures as values
 */
export function groupMeasuresByDay(
  measures: readonly BodyMeasure[],
): Record<string, BodyMeasure[]> {
  return measures.reduce<Record<string, BodyMeasure[]>>((acc, measure) => {
    const day = dateToYYYYMMDD(measure.target_timestamp)
    if (acc[day] === undefined) {
      acc[day] = []
    }
    acc[day].push(measure)
    return acc
  }, {})
}

/**
 * Validates that a body measure has valid numerical values.
 * @param measure - Body measure to validate
 * @returns True if all required measurements are valid numbers > 0
 */
export function isValidBodyMeasure(measure: BodyMeasure): boolean {
  return (
    isFinite(measure.height) &&
    measure.height > 0 &&
    isFinite(measure.waist) &&
    measure.waist > 0 &&
    (measure.hip === undefined || (isFinite(measure.hip) && measure.hip > 0)) &&
    isFinite(measure.neck) &&
    measure.neck > 0
  )
}

/**
 * Calculates the average of numerical values in an array.
 * @param values - Array of numbers
 * @returns Average value or 0 if array is empty
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

/**
 * Calculates average body measurements for a group of measures.
 * @param measures - Array of body measures (should be pre-validated)
 * @returns Object with average measurements
 */
export function calculateBodyMeasureAverages(measures: BodyMeasure[]): {
  height: number
  waist: number
  hip: number | undefined
  neck: number
} {
  const heights = measures.map((m) => m.height)
  const waists = measures.map((m) => m.waist)
  const hips = measures.filter((m) => m.hip !== undefined).map((m) => m.hip!)
  const necks = measures.map((m) => m.neck)

  return {
    height: calculateAverage(heights),
    waist: calculateAverage(waists),
    hip: hips.length > 0 ? calculateAverage(hips) : undefined,
    neck: calculateAverage(necks),
  }
}

/**
 * Filters weights for a specific date.
 * @param weights - Array of weights to filter
 * @param targetDate - Date string to filter by
 * @returns Array of weights for the specified date
 */
export function filterWeightsByDate(
  weights: readonly Weight[],
  targetDate: string,
): Weight[] {
  return weights.filter((weight) => {
    return (
      weight.target_timestamp.toLocaleDateString() === targetDate &&
      isFinite(weight.weight) &&
      weight.weight > 0
    )
  })
}

/**
 * Calculates body fat percentage using averaged measurements.
 * @param averages - Average body measurements
 * @param gender - User's gender
 * @param weightAverage - Average weight for the period
 * @returns Body fat percentage rounded to 2 decimal places, or 0 if invalid
 */
export function calculateBodyFatFromAverages(
  averages: {
    height: number
    waist: number
    hip: number | undefined
    neck: number
  },
  gender: 'male' | 'female',
  weightAverage: number,
): number {
  try {
    const bf = calculateBodyFat({
      gender,
      height: averages.height,
      waist: averages.waist,
      hip: averages.hip,
      neck: averages.neck,
      weight: weightAverage,
    } satisfies BodyFatInput<'male' | 'female'>)

    return isFinite(bf) && bf > 0 ? parseFloat(bf.toFixed(2)) : 0
  } catch {
    return 0
  }
}

/**
 * Processes grouped measures into day-based analysis data.
 * @param groupedMeasures - Measures grouped by day
 * @param weights - Array of weights to consider
 * @param userGender - User's gender for body fat calculation
 * @returns Array of processed day data with averages and body fat
 */
export function processMeasuresByDay(
  groupedMeasures: Record<string, BodyMeasure[]>,
  weights: readonly Weight[],
  userGender: 'male' | 'female',
): Array<{
  date: string
  dayBf: number
  dayAverage: {
    height: number
    waist: number
    hip: number | undefined
    neck: number
  }
}> {
  return Object.entries(groupedMeasures)
    .map(([day, measures]) => {
      // Filter valid measures
      const validMeasures = measures.filter(isValidBodyMeasure)
      if (validMeasures.length === 0) return null

      // Calculate averages
      const averages = calculateBodyMeasureAverages(validMeasures)

      // Calculate weight average for the day
      const dayWeights = filterWeightsByDate(weights, day)
      const weightAverage = calculateAverage(dayWeights.map((w) => w.weight))

      // Calculate body fat
      const dayBf = calculateBodyFatFromAverages(
        averages,
        userGender,
        weightAverage,
      )

      return {
        date: day,
        dayBf,
        dayAverage: averages,
      }
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}
