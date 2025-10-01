import { type MacroProfile } from '~/modules/diet/macro-profile/domain/macroProfile'

export function getLatestMacroProfile(
  macroProfiles: readonly MacroProfile[],
  reverseIndex = 0,
) {
  if (macroProfiles.length < reverseIndex + 1) {
    return null
  }
  return macroProfiles[macroProfiles.length - (1 + reverseIndex)] ?? null
}

export function inForceMacroProfile(
  macroProfiles: readonly MacroProfile[],
  date: Date,
) {
  return [...macroProfiles]
    .reverse()
    .find(
      (item) =>
        item.target_day.getTime() <=
        new Date(date.toISOString().split('T')[0] ?? 0).getTime(),
    )
}
