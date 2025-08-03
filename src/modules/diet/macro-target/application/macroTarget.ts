import {
  createMacroNutrients,
  type MacroNutrients,
} from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { userMacroProfiles } from '~/modules/diet/macro-profile/application/usecases/macroProfileState'
import { type MacroProfile } from '~/modules/diet/macro-profile/domain/macroProfile'
import { inForceMacroProfile } from '~/modules/diet/macro-profile/domain/macroProfileOperations'
import { showError } from '~/modules/toast/application/toastManager'
import { currentUserId } from '~/modules/user/application/user'
import { userWeights } from '~/modules/weight/application/weight'
import { inForceWeight } from '~/shared/utils/weightUtils'

export const calculateMacroTarget = (
  weight: number,
  savedMacroTarget: Pick<
    MacroProfile,
    'gramsPerKgCarbs' | 'gramsPerKgFat' | 'gramsPerKgProtein'
  >,
): MacroNutrients =>
  createMacroNutrients({
    carbs: weight * savedMacroTarget.gramsPerKgCarbs,
    protein: weight * savedMacroTarget.gramsPerKgProtein,
    fat: weight * savedMacroTarget.gramsPerKgFat,
  })

class WeightNotFoundForDayError extends Error {
  readonly day: Date
  readonly userId: number
  readonly errorId: string

  constructor(day: Date, userId: number) {
    super(
      `Peso não encontrado para o dia ${day.toISOString()}, usuário ${userId}`,
    )
    this.name = 'WeightNotFoundForDayError'
    this.day = day
    this.userId = userId
    this.errorId = `weight-not-found-${userId}-${day.toISOString()}`
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      day: this.day.toISOString(),
      userId: this.userId,
      errorId: this.errorId,
      stack: this.stack,
    }
  }
}

class MacroTargetNotFoundForDayError extends Error {
  readonly day: Date
  readonly userId: number
  readonly errorId: string

  constructor(day: Date, userId: number) {
    super(
      `Meta de macros não encontrada para o dia ${day.toISOString()}, usuário ${userId}`,
    )
    this.name = 'MacroTargetNotFoundForDayError'
    this.day = day
    this.userId = userId
    this.errorId = `macro-target-not-found-${userId}-${day.toISOString()}`
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      day: this.day.toISOString(),
      userId: this.userId,
      errorId: this.errorId,
      stack: this.stack,
    }
  }
}

export const getMacroTargetForDay = (day: Date): MacroNutrients | null => {
  const targetDayWeight_ =
    inForceWeight(userWeights.latest, day)?.weight ?? null
  const targetDayMacroProfile_ = inForceMacroProfile(userMacroProfiles(), day)

  const userId = currentUserId()

  if (targetDayWeight_ === null) {
    showError(new WeightNotFoundForDayError(day, userId), {
      audience: 'system',
    })
    return null
  }

  if (targetDayMacroProfile_ === null) {
    showError(new MacroTargetNotFoundForDayError(day, userId), {
      audience: 'system',
    })
    return null
  }

  return calculateMacroTarget(targetDayWeight_, targetDayMacroProfile_)
}
