import { type MacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { type MacroProfile } from '~/modules/diet/macro-profile/domain/macroProfile'
import { getEffectiveMacroProfile } from '~/modules/diet/macro-profile/domain/macroProfileOperations'
import { MacroTargetExt } from '~/modules/diet/macro-target/domain/macroTargetExt'
import type { WeightUseCases } from '~/modules/weight/application/weight/usecases/weightUseCases'
import { logging } from '~/shared/utils/logging'

/**
 * Factory that creates macro-target use-cases with injectable dependencies.
 *
 * Allows injecting `getEffectiveMacroProfile` for testing or alternate DI wiring.
 */
export function createMacroTargetUseCases(deps: {
  weightUseCases: WeightUseCases
  userMacroProfiles: () => readonly MacroProfile[]
  getEffectiveMacroProfile?: typeof getEffectiveMacroProfile
}) {
  const localGetEffectiveMacroProfile =
    deps.getEffectiveMacroProfile ?? getEffectiveMacroProfile

  function macroTargetAt(day: Date): MacroNutrients | null {
    const targetDayWeight_ =
      deps.weightUseCases.effectiveAt(day)?.weight ?? null
    const targetDayMacroProfile_ = localGetEffectiveMacroProfile(
      deps.userMacroProfiles(),
      day,
    )

    if (targetDayWeight_ === null) {
      logging.warn('macroTargetUseCases: Weight not found for day', {
        component: 'macroTargetUseCases',
        day: day.toISOString(),
      })
      return null
    }

    if (targetDayMacroProfile_ === null) {
      logging.warn('macroTargetUseCases: Macro profile not found for day', {
        component: 'macroTargetUseCases',
        day: day.toISOString(),
      })
      return null
    }

    return MacroTargetExt.forWeight(targetDayMacroProfile_, targetDayWeight_)
  }

  return {
    macroTargetAt,
  }
}
export type MacroTargetUseCases = ReturnType<typeof createMacroTargetUseCases>
