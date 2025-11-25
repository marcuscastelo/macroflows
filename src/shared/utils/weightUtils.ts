import { type Weight } from '~/modules/weight/domain/weight/weight'
import { WeightsExt } from '~/modules/weight/domain/weight/weightsExt'

function floatEqual(a: number, b: number, epsilon = 1e-3): boolean {
  return Math.abs(a - b) < epsilon
}

function calcDirection(end: number, start: number, precision = 1) {
  const factor = Math.pow(10, precision)
  const rounded = {
    end: Math.round(end * factor) / factor,
    start: Math.round(start * factor) / factor,
  }
  return floatEqual(rounded.end, rounded.start)
    ? ('none' as const)
    : rounded.end > rounded.start
      ? ('gain' as const)
      : ('loss' as const)
}

function getTotalAndChange(
  firstWeight: number,
  latestWeight: number,
  desiredWeight: number,
  diet: 'cut' | 'normo' | 'bulk',
) {
  let goalDirection: 'gain' | 'loss' | 'none'
  switch (diet) {
    case 'cut':
      goalDirection = 'loss'
      break
    case 'bulk':
      goalDirection = 'gain'
      break
    case 'normo':
      goalDirection = 'none'
      break
    default:
      diet satisfies never
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`Unknown diet type: ${diet}`)
  }

  return {
    goalWeightChange: {
      change:
        goalDirection === 'none'
          ? 0
          : Math.round(Math.abs(desiredWeight - firstWeight) * 10) / 10,
      direction: goalDirection,
    },
    currentChange: {
      change: Math.round(Math.abs(latestWeight - firstWeight) * 10) / 10,
      direction: calcDirection(latestWeight, firstWeight),
    },
  }
}

/**
 * Type for the result of calculateWeightProgress.
 */
export type WeightProgressResult =
  | {
      type: 'no_weights'
    }
  | {
      type: 'progress'
      progress: number
      currentChange: { change: number; direction: 'gain' | 'loss' | 'none' }
      goalWeightChange: { change: number; direction: 'gain' | 'loss' | 'none' }
    }
  | {
      type: 'no_change'
      currentChange: { change: number; direction: 'gain' | 'loss' | 'none' }
      goalWeightChange: { change: number; direction: 'gain' | 'loss' | 'none' }
    }
  | {
      type: 'exceeded'
      exceeded: number
      currentChange: { change: number; direction: 'gain' | 'loss' | 'none' }
      goalWeightChange: { change: number; direction: 'gain' | 'loss' | 'none' }
    }
  | {
      type: 'reversal'
      reversal: number
      currentChange: { change: number; direction: 'gain' | 'loss' | 'none' }
      goalWeightChange: { change: number; direction: 'gain' | 'loss' | 'none' }
    }
  | {
      type: 'normo'
      difference: number
      direction: 'gain' | 'loss' | 'none'
      currentChange: { change: number; direction: 'gain' | 'loss' | 'none' }
      goalWeightChange: { change: number; direction: 'gain' | 'loss' | 'none' }
    }

/**
 * Calculates the user's weight progress towards a target.
 * @param weights - Array of Weight objects
 * @param desiredWeight - Target weight
 * @param diet - Diet type ('cut', 'normo', 'bulk')
 * @returns WeightProgressResult or null if invalid input
 */
export function calculateWeightProgress(
  weights: readonly Weight[],
  desiredWeight: number,
  diet: 'cut' | 'normo' | 'bulk',
): WeightProgressResult | null {
  if (weights.length === 0) {
    return {
      type: 'no_weights' as const,
    }
  }
  const weightPipe = WeightsExt.of(weights)
  const first = weightPipe.oldest()
  const latest = weightPipe.latest()
  if (!first || !latest) return null
  const { goalWeightChange, currentChange } = getTotalAndChange(
    first.weight,
    latest.weight,
    desiredWeight,
    diet,
  )

  if (goalWeightChange.direction === 'none') {
    return {
      type: 'normo' as const,
      difference: Math.abs(latest.weight - desiredWeight),
      direction: calcDirection(latest.weight, desiredWeight, 1),
      currentChange,
      goalWeightChange,
    }
  }

  if (goalWeightChange.change === 0 && currentChange.change === 0) {
    return {
      type: 'progress' as const,
      progress: 100,
      currentChange,
      goalWeightChange,
    }
  }

  if (weights.length === 1 || currentChange.change === 0) {
    return {
      type: 'no_change' as const,
      currentChange,
      goalWeightChange,
    }
  }

  if (currentChange.direction !== goalWeightChange.direction) {
    return {
      type: 'reversal' as const,
      reversal: Math.abs(latest.weight - first.weight),
      currentChange,
      goalWeightChange,
    }
  }

  if (currentChange.change > goalWeightChange.change) {
    return {
      type: 'exceeded' as const,
      exceeded: Math.abs(latest.weight - desiredWeight),
      currentChange,
      goalWeightChange,
    }
  }

  return {
    type: 'progress' as const,
    progress: (currentChange.change / goalWeightChange.change) * 100,
    currentChange,
    goalWeightChange,
  }
}
