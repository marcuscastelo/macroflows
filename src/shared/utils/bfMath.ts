import { z } from 'zod/v4'

import { type BodyMeasure } from '~/modules/measure/domain/measure'
import { type User } from '~/modules/user/domain/user'
import { type Weight } from '~/modules/weight/domain/weight/weight'
import { parseWithStack } from '~/shared/utils/parseWithStack'

export type BodyFatInput<T extends User['gender']> = {
  gender: T
  weight: Weight['weight']
  waist: BodyMeasure['waist']
  neck: BodyMeasure['neck']
  hip: T extends 'male' ? BodyMeasure['hip'] : NonNullable<BodyMeasure['hip']>
  height: BodyMeasure['height']
}

export function calculateBodyFat<T extends User['gender']>(
  input: BodyFatInput<T>,
) {
  if (input.gender === 'male') {
    return calculateMaleBodyFat({
      ...input,
      gender: 'male',
    })
  } else {
    return calculateFemaleBodyFat({
      ...input,
      gender: 'female',
      hip: parseWithStack(z.number(), input.hip),
    })
  }
}

function calculateMaleBodyFat(input: BodyFatInput<'male'>) {
  const k1 = 1.0324
  const k2 = 0.19077
  const l2 = Math.log10(input.waist - input.neck)
  const k3 = 0.15456
  const l3 = Math.log10(input.height)
  return 495 / (k1 - k2 * l2 + k3 * l3) - 450
}

function calculateFemaleBodyFat(input: BodyFatInput<'female'>) {
  const k1 = 1.29579
  const k2 = 0.35004
  const l2 = Math.log10(input.waist + input.hip - input.neck)
  const k3 = 0.221
  const l3 = Math.log10(input.height)
  return 495 / (k1 - k2 * l2 + k3 * l3) - 450
}
