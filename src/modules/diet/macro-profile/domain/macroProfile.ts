import { z } from 'zod/v4'

import { createZodEntity } from '~/shared/domain/validation'

const ze = createZodEntity('MacroProfile')

export const {
  schema: macroProfileSchema,
  newSchema: newMacroProfileSchema,
  createNew: createNewMacroProfile,
  promote: promoteToMacroProfile,
  demote: demoteToNewMacroProfile,
} = ze.create({
  user_id: ze.string(),
  target_day: z
    .date()
    .or(z.string())
    .transform((v) => new Date(v)),
  gramsPerKgCarbs: ze.number().transform((v) => (isNaN(v) || v < 0 ? 0 : v)),
  gramsPerKgProtein: ze.number().transform((v) => (isNaN(v) || v < 0 ? 0 : v)),
  gramsPerKgFat: ze.number().transform((v) => (isNaN(v) || v < 0 ? 0 : v)),
})

/**
 * A MacroProfile that has been saved to the database (has an id).
 */
export type MacroProfile = Readonly<z.infer<typeof macroProfileSchema>>

/**
 * A MacroProfile that has not been saved yet (used for insert operations).
 */
export type NewMacroProfile = Readonly<z.infer<typeof newMacroProfileSchema>>

/**
 * Semantic alias for NewMacroProfile - represents a profile that hasn't been saved yet.
 * Used for default profiles when no profile exists in the database.
 */
export type UnsavedMacroProfile = NewMacroProfile

/**
 * Union type for a MacroProfile that may or may not be saved.
 * Use type guards `isSavedMacroProfile` and `isUnsavedMacroProfile` to narrow.
 */
export type MaybeSavedMacroProfile = MacroProfile | UnsavedMacroProfile

/**
 * Type guard to check if a profile has been saved (has an id).
 */
export function isSavedMacroProfile(
  profile: MaybeSavedMacroProfile,
): profile is MacroProfile {
  return 'id' in profile && typeof profile.id === 'number'
}

/**
 * Type guard to check if a profile is unsaved (no id).
 */
export function isUnsavedMacroProfile(
  profile: MaybeSavedMacroProfile,
): profile is UnsavedMacroProfile {
  return !isSavedMacroProfile(profile)
}
