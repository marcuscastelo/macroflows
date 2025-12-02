import { type MacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { userMacroProfiles } from '~/modules/diet/macro-profile/application/usecases/macroProfileState'
import { getEffectiveMacroProfile } from '~/modules/diet/macro-profile/domain/macroProfileOperations'
import { MacroTargetExt } from '~/modules/diet/macro-target/domain/macroTargetExt'
import { showError } from '~/modules/toast/application/toastManager'
import { weightUseCases } from '~/modules/weight/application/weight/usecases/weightUseCases'
import { logging } from '~/shared/utils/logging'

const macroTargetAt = (day: Date): MacroNutrients | null => {
  const targetDayWeight_ = weightUseCases.effectiveAt(day)?.weight ?? null
  const targetDayMacroProfile_ = getEffectiveMacroProfile(
    userMacroProfiles(),
    day,
  )

  if (targetDayWeight_ === null) {
    logging.warn('macroTargetUseCases: Weight not found for day', {
      component: 'macroTargetUseCases',
      day: day.toISOString(),
    })
    showError(
      new Error(`Peso não encontrado para o dia ${day.toISOString()}`),
      {},
    )
    return null
  }

  if (targetDayMacroProfile_ === null) {
    logging.warn('macroTargetUseCases: Macro profile not found for day', {
      component: 'macroTargetUseCases',
      day: day.toISOString(),
    })
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

export const macroTargetUseCases = {
  macroTargetAt,
}
