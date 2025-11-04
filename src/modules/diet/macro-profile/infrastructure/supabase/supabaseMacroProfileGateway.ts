import {
  type MacroProfile,
  type NewMacroProfile,
} from '~/modules/diet/macro-profile/domain/macroProfile'
import { type MacroProfileGateway } from '~/modules/diet/macro-profile/domain/macroProfileGateway'
import { SUPABASE_TABLE_MACRO_PROFILES } from '~/modules/diet/macro-profile/infrastructure/supabase/constants'
import { supabaseMacroProfileMapper } from '~/modules/diet/macro-profile/infrastructure/supabase/supabaseMacroProfileMapper'
import { type User } from '~/modules/user/domain/user'
import { supabase } from '~/shared/supabase/supabase'
import { logging } from '~/shared/utils/logging'

export function createSupabaseMacroProfileGateway(): MacroProfileGateway {
  return {
    fetchUserMacroProfiles,
    insertMacroProfile,
    updateMacroProfile,
    deleteMacroProfile,
  }
}

async function fetchUserMacroProfiles(
  userId: User['uuid'],
): Promise<readonly MacroProfile[]> {
  const { data, error } = await supabase
    .from(SUPABASE_TABLE_MACRO_PROFILES)
    .select('*')
    .eq('user_id', userId)
    .order('target_day', { ascending: true })

  if (error !== null) {
    logging.error('MacroProfile fetch error:', error)
    throw error
  }

  return data.map(supabaseMacroProfileMapper.toDomain)
}

async function insertMacroProfile(
  newMacroProfile: NewMacroProfile,
): Promise<MacroProfile | null> {
  const createDTO = supabaseMacroProfileMapper.toInsertDTO(newMacroProfile)
  const { data, error } = await supabase
    .from(SUPABASE_TABLE_MACRO_PROFILES)
    .insert(createDTO)
    .select()
    .single()

  if (error !== null) {
    logging.error('MacroProfile fetch error:', error)
    throw error
  }

  return supabaseMacroProfileMapper.toDomain(data)
}

async function updateMacroProfile(
  profileId: MacroProfile['id'],
  newMacroProfile: NewMacroProfile,
): Promise<MacroProfile | null> {
  const updateDTO = supabaseMacroProfileMapper.toInsertDTO(newMacroProfile)
  const { data, error } = await supabase
    .from(SUPABASE_TABLE_MACRO_PROFILES)
    .update(updateDTO)
    .eq('id', profileId)
    .select()
    .single()

  if (error !== null) {
    logging.error('MacroProfile fetch error:', error)
    throw error
  }

  return supabaseMacroProfileMapper.toDomain(data)
}

async function deleteMacroProfile(id: MacroProfile['id']): Promise<void> {
  const { error } = await supabase
    .from(SUPABASE_TABLE_MACRO_PROFILES)
    .delete()
    .eq('id', id)

  if (error !== null) {
    logging.error('MacroProfile fetch error:', error)
    throw error
  }
}
