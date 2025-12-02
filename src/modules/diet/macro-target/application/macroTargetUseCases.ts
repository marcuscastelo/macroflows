import { type MacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { userMacroProfiles } from '~/modules/diet/macro-profile/application/usecases/macroProfileState'
import { getEffectiveMacroProfile } from '~/modules/diet/macro-profile/domain/macroProfileOperations'
import { MacroTargetExt } from '~/modules/diet/macro-target/domain/macroTargetExt'
import { weightUseCases } from '~/modules/weight/application/weight/usecases/weightUseCases'
import { logging } from '~/shared/utils/logging'

const macroTargetAt = (day: Date): MacroNutrients | null => {
  const targetDayWeight_ = weightUseCases.effectiveAt(day)?.weight ?? null
  const targetDayMacroProfile_ = getEffectiveMacroProfile(
    userMacroProfiles(),
    day,
  )

  if (targetDayWeight_ === null) {
    logging.debug(`Weight not found for day ${day.toISOString()}`)
    return null
  }

  if (targetDayMacroProfile_ === null) {
    logging.debug(`Macro target not found for day ${day.toISOString()}`)
    return null
  }

  return MacroTargetExt.forWeight(targetDayMacroProfile_, targetDayWeight_)
}

export const macroTargetUseCases = {
  macroTargetAt,
}
