import { useCases, type WeightUseCases } from '~/di/useCases'
import { type Weight } from '~/modules/weight/domain/weight/weight'
import { WeightsExt } from '~/modules/weight/domain/weight/weightsExt'

/**
 * Helper: compare floats with epsilon
 */
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
    default: {
      const _exhaustiveDiet: never = diet
      throw new Error('Unknown diet type: ' + String(_exhaustiveDiet))
    }
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
function calculateWeightProgress(
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

/**
 * Factory that creates weight-chart related helpers.
 *
 * Allows injecting `useCases` or `weightUseCases` for testing/DI.
 * Now uses the centralized container's weightUseCases by default.
 */
export function createWeightChartUseCases(deps?: {
  useCases?: typeof useCases
  weightUseCases?: WeightUseCases
}) {
  const localUseCases = deps?.useCases ?? useCases
  // Use centralized weightUseCases from container by default
  const localWeightUseCases =
    deps?.weightUseCases ?? localUseCases.weightUseCases()

  function desiredWeight(): number {
    return localUseCases.userUseCases().currentUser()?.desired_weight ?? 0
  }

  function weightProgress() {
    return calculateWeightProgress(
      localWeightUseCases.weights(),
      desiredWeight(),
      localUseCases.userUseCases().currentUser()?.diet ?? 'cut',
    )
  }

  const weightProgressText = () => {
    const progress = weightProgress()
    if (progress === null) return 'N/A'

    switch (progress.type) {
      case 'no_weights':
        return 'Nenhum peso registrado'
      case 'progress':
        if (progress.progress >= 100) {
          return `100% 🎉`
        } else {
          return `${progress.progress.toFixed(1)}%`
        }
      case 'exceeded':
        return `100% + ${progress.exceeded.toFixed(1)}kg 🎉`
      case 'no_change':
        return 'Sem mudança'
      case 'reversal': {
        const signal = progress.currentChange.direction === 'gain' ? '+' : '-'
        return `Diverge ${signal}${progress.reversal.toFixed(1)}kg`
      }
      case 'normo':
        if (progress.difference === 0) {
          return 'Peso ideal atingido 🎉'
        } else {
          const signal = progress.direction === 'gain' ? '+' : '-'
          return `Variação: ${signal}${progress.difference.toFixed(1)}kg`
        }
      default:
        progress satisfies never
    }
  }

  return {
    calculateWeightProgress,
    weightProgress,
    desiredWeight,
    weightProgressText,
  }
}

/**
 * Backward-compatible shim kept for legacy consumers.
 * Consumers may continue to import `weightChartUseCases`.
 */
export const weightChartUseCases = createWeightChartUseCases()

export type WeightChartUseCases = ReturnType<typeof createWeightChartUseCases>
