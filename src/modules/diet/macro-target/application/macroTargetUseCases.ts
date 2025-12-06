import { type MacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { userMacroProfiles } from '~/modules/diet/macro-profile/application/usecases/macroProfileState'
import { getEffectiveMacroProfile } from '~/modules/diet/macro-profile/domain/macroProfileOperations'
import { MacroTargetExt } from '~/modules/diet/macro-target/domain/macroTargetExt'
import { weightUseCases } from '~/modules/weight/application/weight/usecases/weightUseCases'
import { logging } from '~/shared/utils/logging'

/**
 * Factory that creates macro-target use-cases with injectable dependencies.
 *
 * Allows injecting `weightUseCases`, `userMacroProfiles` and `getEffectiveMacroProfile`
 * for testing or alternate DI wiring. When not provided, module defaults are used.
 */
export function createMacroTargetUseCases(deps?: {
  weightUseCases?: typeof weightUseCases
  userMacroProfiles?: typeof userMacroProfiles
  getEffectiveMacroProfile?: typeof getEffectiveMacroProfile
}) {
  const localWeightUseCases = deps?.weightUseCases ?? weightUseCases
  const localUserMacroProfiles = deps?.userMacroProfiles ?? userMacroProfiles
  const localGetEffectiveMacroProfile =
    deps?.getEffectiveMacroProfile ?? getEffectiveMacroProfile

  function macroTargetAt(day: Date): MacroNutrients | null {
    const targetDayWeight_ =
      localWeightUseCases.effectiveAt(day)?.weight ?? null
    const targetDayMacroProfile_ = localGetEffectiveMacroProfile(
      localUserMacroProfiles(),
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

/**
 * Backward-compatible shim: preserve the previous top-level export while
 * allowing DI consumers to call `createMacroTargetUseCases` directly.
 */
export const macroTargetUseCases = createMacroTargetUseCases()
export type MacroTargetUseCases = ReturnType<typeof createMacroTargetUseCases>
