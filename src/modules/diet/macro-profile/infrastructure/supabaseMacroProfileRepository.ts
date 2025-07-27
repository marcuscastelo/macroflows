import {
  type MacroProfile,
  type NewMacroProfile,
} from '~/modules/diet/macro-profile/domain/macroProfile'
import { type MacroProfileRepository } from '~/modules/diet/macro-profile/domain/macroProfileRepository'
import {
  createInsertMacroProfileDAOFromNewMacroProfile,
  createMacroProfileFromDAO,
  createUpdateMacroProfileDAOFromNewMacroProfile,
  macroProfileDAOSchema,
} from '~/modules/diet/macro-profile/infrastructure/macroProfileDAO'
import { type User } from '~/modules/user/domain/user'
import { createErrorHandler } from '~/shared/error/errorHandler'
import { parseWithStack } from '~/shared/utils/parseWithStack'
import supabase, {
  registerSubapabaseRealtimeCallback,
} from '~/shared/utils/supabase'

/**
 * Supabase table name for macro profiles.
 */
export const SUPABASE_TABLE_MACRO_PROFILES = 'macro_profiles'

/**
 * Creates a MacroProfileRepository implementation using Supabase as backend.
 * @returns {MacroProfileRepository} The repository instance.
 */
const errorHandler = createErrorHandler('infrastructure', 'MacroProfile')

export function createSupabaseMacroProfileRepository(): MacroProfileRepository {
  return {
    fetchUserMacroProfiles,
    insertMacroProfile,
    updateMacroProfile,
    deleteMacroProfile,
  }
}

/**
 * Sets up realtime subscription for macro profile changes
 * @param onMacroProfilesChange - Callback function to call when data changes
 */
export function setupMacroProfileRealtimeSubscription(
  onMacroProfilesChange: () => void,
): void {
  registerSubapabaseRealtimeCallback(
    SUPABASE_TABLE_MACRO_PROFILES,
    onMacroProfilesChange,
  )
}

/**
 * Fetches all macro profiles for a user.
 * @param {User['id']} userId - The user ID.
 * @returns {Promise<readonly MacroProfile[]>} Array of macro profiles. Throws on error.
 * @throws {Error} On API or validation error.
 */
async function fetchUserMacroProfiles(
  userId: User['id'],
): Promise<readonly MacroProfile[]> {
  const { data, error } = await supabase
    .from(SUPABASE_TABLE_MACRO_PROFILES)
    .select('*')
    .eq('owner', userId)
    .order('target_day', { ascending: true })

  if (error !== null) {
    errorHandler.error(error)
    throw error
  }

  let macroProfileDAOs
  try {
    macroProfileDAOs = parseWithStack(macroProfileDAOSchema.array(), data)
  } catch (validationError) {
    errorHandler.error(validationError)
    throw validationError
  }
  return macroProfileDAOs.map(createMacroProfileFromDAO)
}

/**
 * Inserts a new macro profile.
 * @param {NewMacroProfile} newMacroProfile - The macro profile to insert.
 * @returns {Promise<MacroProfile>} The inserted macro profile. Throws on error.
 * @throws {Error} On API or validation error.
 */
async function insertMacroProfile(
  newMacroProfile: NewMacroProfile,
): Promise<MacroProfile> {
  const createDAO =
    createInsertMacroProfileDAOFromNewMacroProfile(newMacroProfile)
  const { data, error } = await supabase
    .from(SUPABASE_TABLE_MACRO_PROFILES)
    .insert(createDAO)
    .select()

  if (error !== null) {
    errorHandler.error(error)
    throw error
  }

  let macroProfileDAOs
  try {
    macroProfileDAOs = parseWithStack(macroProfileDAOSchema.array(), data)
  } catch (validationError) {
    errorHandler.error(validationError)
    throw validationError
  }
  if (!macroProfileDAOs[0]) {
    const notFoundError = new Error(
      'Inserted macro profile not found in response',
    )
    errorHandler.error(notFoundError)
    throw notFoundError
  }
  return createMacroProfileFromDAO(macroProfileDAOs[0])
}

/**
 * Updates an existing macro profile.
 * @param {MacroProfile['id']} profileId - The macro profile ID.
 * @param {NewMacroProfile} newMacroProfile - The new macro profile data.
 * @returns {Promise<MacroProfile>} The updated macro profile. Throws on error.
 * @throws {Error} On API or validation error.
 */
async function updateMacroProfile(
  profileId: MacroProfile['id'],
  newMacroProfile: NewMacroProfile,
): Promise<MacroProfile> {
  const updateDAO =
    createUpdateMacroProfileDAOFromNewMacroProfile(newMacroProfile)
  const { data, error } = await supabase
    .from(SUPABASE_TABLE_MACRO_PROFILES)
    .update(updateDAO)
    .eq('id', profileId)
    .select()

  if (error !== null) {
    errorHandler.error(error)
    throw error
  }

  let macroProfileDAOs
  try {
    macroProfileDAOs = parseWithStack(macroProfileDAOSchema.array(), data)
  } catch (validationError) {
    errorHandler.error(validationError)
    throw validationError
  }
  if (!macroProfileDAOs[0]) {
    const notFoundError = new Error(
      'Updated macro profile not found in response',
    )
    errorHandler.error(notFoundError)
    throw notFoundError
  }
  return createMacroProfileFromDAO(macroProfileDAOs[0])
}

/**
 * Deletes a macro profile by ID.
 * @param {MacroProfile['id']} id - The macro profile ID.
 * @returns {Promise<void>} Resolves on success. Throws on error.
 * @throws {Error} On API error.
 */
async function deleteMacroProfile(id: MacroProfile['id']): Promise<void> {
  const { error } = await supabase
    .from(SUPABASE_TABLE_MACRO_PROFILES)
    .delete()
    .eq('id', id)

  if (error !== null) {
    errorHandler.error(error)
    throw error
  }
}
