import { type MacroProfile } from '~/modules/diet/macro-profile/domain/macroProfile'

export function getLatestMacroProfile(
  profiles: readonly MacroProfile[],
  offset: number = 0,
): MacroProfile | null {
  if (profiles.length === 0) return null

  const sortedProfiles = [...profiles].sort(
    (a, b) =>
      new Date(b.target_day).getTime() - new Date(a.target_day).getTime(),
  )

  return sortedProfiles[offset] ?? null
}

export function getMacroProfileByDate(
  profiles: readonly MacroProfile[],
  targetDate: Date,
): MacroProfile | null {
  return (
    profiles.find((profile) => {
      const profileDate = new Date(profile.target_day)
      return profileDate.toDateString() === targetDate.toDateString()
    }) ?? null
  )
}

export function calculateTotalMacros(
  profile: MacroProfile,
  bodyWeightKg: number,
): {
  totalCarbs: number
  totalProtein: number
  totalFat: number
  totalCalories: number
} {
  const totalCarbs = profile.gramsPerKgCarbs * bodyWeightKg
  const totalProtein = profile.gramsPerKgProtein * bodyWeightKg
  const totalFat = profile.gramsPerKgFat * bodyWeightKg

  // 1g carbs = 4 kcal, 1g protein = 4 kcal, 1g fat = 9 kcal
  const totalCalories = totalCarbs * 4 + totalProtein * 4 + totalFat * 9

  return {
    totalCarbs,
    totalProtein,
    totalFat,
    totalCalories,
  }
}

export function getFirstMacroProfile(
  profiles: readonly MacroProfile[],
): MacroProfile | null {
  if (profiles.length === 0) return null
  return profiles[0] ?? null
}

export function inForceMacroProfile(
  profiles: readonly MacroProfile[],
  date: Date,
): MacroProfile | null {
  const reversedProfiles = [...profiles].reverse()
  const found = reversedProfiles.find(
    (profile) => new Date(profile.target_day).getTime() <= date.getTime(),
  )
  return found === undefined ? null : found
}
