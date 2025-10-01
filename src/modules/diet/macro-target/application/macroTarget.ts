import {
  createMacroNutrients,
  type MacroNutrients,
} from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { userMacroProfiles } from '~/modules/diet/macro-profile/application/usecases/macroProfileState'
import { type MacroProfile } from '~/modules/diet/macro-profile/domain/macroProfile'
import { inForceMacroProfile } from '~/modules/diet/macro-profile/domain/macroProfileOperations'
import { showError } from '~/modules/toast/application/toastManager'
import { currentUserId } from '~/modules/user/application/user'
import { type User } from '~/modules/user/domain/user'
import { userWeights } from '~/modules/weight/application/usecases/weightState'
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



export const getMacroTargetForDay = (day: Date): MacroNutrients | null => {
  const targetDayWeight_ = inForceWeight(userWeights(), day)?.weight ?? null
  const targetDayMacroProfile_ = inForceMacroProfile(userMacroProfiles(), day)

  const userId = currentUserId()

  if (targetDayWeight_ === null) {
    showError(
      new Error(`Peso não encontrado para o dia ${day.toISOString()}`, {
        cause: {
          day: day.toISOString(),
          userId,
          operation: 'getMacroTargetForDay',
          errorId: `weight-not-found-${userId}-${day.toISOString()}`,
        },
      }),
      {},
    )
    return null
  }

  if (targetDayMacroProfile_ === null) {
    showError(
      new Error(`Meta de macros não encontrada para o dia ${day.toISOString()}`, {
        cause: {
          day: day.toISOString(),
          userId,
          operation: 'getMacroTargetForDay',
          errorId: `macro-target-not-found-${userId}-${day.toISOString()}`,
        },
      }),
      {},
    )
    return null
  }

  return calculateMacroTarget(targetDayWeight_, targetDayMacroProfile_)
}
