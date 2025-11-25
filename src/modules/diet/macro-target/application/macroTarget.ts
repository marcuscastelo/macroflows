import { type MacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { userMacroProfiles } from '~/modules/diet/macro-profile/application/usecases/macroProfileState'
import { getEffectiveMacroProfile } from '~/modules/diet/macro-profile/domain/macroProfileOperations'
import { MacroTargetExt } from '~/modules/diet/macro-target/domain/macroTargetExt'
import { showError } from '~/modules/toast/application/toastManager'
import { currentUserId } from '~/modules/user/application/user'
import { weightUseCases } from '~/modules/weight/application/weight/weightUseCases'

export const getMacroTargetForDay = (day: Date): MacroNutrients | null => {
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
    showError(
      new Error(`Peso não encontrado para o dia ${day.toISOString()}`),
      {},
    )
    return null
  }

  if (targetDayMacroProfile_ === null) {
    if (userId === undefined) {
      console.error('User ID is undefined')
      return null
    }
    showError(
      new Error(
        `Meta de macros não encontrada para o dia ${day.toISOString()}`,
      ),
      {},
    )
    return null
  }

  return MacroTargetExt.forWeight(targetDayMacroProfile_, targetDayWeight_)
}
