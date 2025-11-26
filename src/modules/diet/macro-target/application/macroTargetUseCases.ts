import { type MacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { userMacroProfiles } from '~/modules/diet/macro-profile/application/usecases/macroProfileState'
import { getEffectiveMacroProfile } from '~/modules/diet/macro-profile/domain/macroProfileOperations'
import { MacroTargetExt } from '~/modules/diet/macro-target/domain/macroTargetExt'
import { showError } from '~/modules/toast/application/toastManager'
import { currentUserId } from '~/modules/user/application/user'
import { weightUseCases } from '~/modules/weight/application/weight/weightUseCases'
import {
  MacroTargetNotFoundForDayError,
  WeightNotFoundForDayError,
} from '~/shared/error/deduplicableError'

const macroTargetAt = (day: Date): MacroNutrients | null => {
  const targetDayWeight_ = weightUseCases.effectiveAt(day)?.weight ?? null
  const targetDayMacroProfile_ = getEffectiveMacroProfile(
    userMacroProfiles(),
    day,
  )

  const userId = currentUserId()

  if (targetDayWeight_ === null) {
    if (userId === undefined) {
      console.error('User ID is undefined')
      return null
    }
    showError(new WeightNotFoundForDayError(day), {})
    return null
  }

  if (targetDayMacroProfile_ === null) {
    if (userId === undefined) {
      console.error('User ID is undefined')
      return null
    }
    showError(new MacroTargetNotFoundForDayError(day), {})
    return null
  }

  return MacroTargetExt.forWeight(targetDayMacroProfile_, targetDayWeight_)
}

export const macroTargetUseCases = {
  macroTargetAt,
}
