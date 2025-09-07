import {
  type MacroProfile,
  type NewMacroProfile,
} from '~/modules/diet/macro-profile/domain/macroProfile'
import { type MacroProfileGateway } from '~/modules/diet/macro-profile/domain/macroProfileGateway'
import { SUPABASE_TABLE_MACRO_PROFILES } from '~/modules/diet/macro-profile/infrastructure/supabase/constants'
import {
  macroProfileDAOSchema,
  supabaseMacroProfileMapper,
} from '~/modules/diet/macro-profile/infrastructure/supabase/supabaseMacroProfileMapper'
import { type User } from '~/modules/user/domain/user'
import { createErrorHandler } from '~/shared/error/errorHandler'
import { supabase } from '~/shared/supabase/supabase'
import { parseWithStack } from '~/shared/utils/parseWithStack'
const errorHandler = createErrorHandler('infrastructure', 'MacroProfileGateway')

export function createSupabaseMacroProfileGateway(): MacroProfileGateway {
  return {
    fetchUserMacroProfiles,
    insertMacroProfile,
    updateMacroProfile,
    deleteMacroProfile,
  }
}

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

  return macroProfileDAOs.map(supabaseMacroProfileMapper.toDomain)
}

async function insertMacroProfile(
  newMacroProfile: NewMacroProfile,
): Promise<MacroProfile | null> {
  const createDAO = supabaseMacroProfileMapper.toInsertDTO(newMacroProfile)
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

  return supabaseMacroProfileMapper.toDomain(macroProfileDAOs[0])
}

async function updateMacroProfile(
  profileId: MacroProfile['id'],
  newMacroProfile: NewMacroProfile,
): Promise<MacroProfile | null> {
  const updateDAO = supabaseMacroProfileMapper.toInsertDTO(newMacroProfile)
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

  return supabaseMacroProfileMapper.toDomain(macroProfileDAOs[0])
}

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
