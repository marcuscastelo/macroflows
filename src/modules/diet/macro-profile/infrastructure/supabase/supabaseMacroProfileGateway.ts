import {
  type MacroProfile,
  macroProfileSchema,
  type NewMacroProfile,
} from '~/modules/diet/macro-profile/domain/macroProfile'
import { type MacroProfileGateway } from '~/modules/diet/macro-profile/domain/macroProfileGateway'
import { type User } from '~/modules/user/domain/user'
import { type Database } from '~/shared/supabase/database.types'
import { supabase } from '~/shared/supabase/supabase'
import { logging } from '~/shared/utils/logging'
import { parseWithStack } from '~/shared/utils/parseWithStack'

const SUPABASE_TABLE_MACRO_PROFILES = 'macro_profiles'

type InsertMacroProfileDTO =
  Database['public']['Tables']['macro_profiles']['Insert']
type MacroProfileDTO = Database['public']['Tables']['macro_profiles']['Row']

function toInsertDTO(newMacroProfile: NewMacroProfile): InsertMacroProfileDTO {
  return {
    user_id: newMacroProfile.user_id,
    target_day: newMacroProfile.target_day.toISOString(),
    gramsPerKgCarbs: newMacroProfile.gramsPerKgCarbs,
    gramsPerKgProtein: newMacroProfile.gramsPerKgProtein,
    gramsPerKgFat: newMacroProfile.gramsPerKgFat,
  }
}

function toDomain(dto: MacroProfileDTO): MacroProfile {
  return parseWithStack(macroProfileSchema, {
    id: dto.id,
    user_id: dto.user_id,
    target_day: new Date(dto.target_day ?? ''),
    gramsPerKgCarbs: dto.gramsPerKgCarbs,
    gramsPerKgProtein: dto.gramsPerKgProtein,
    gramsPerKgFat: dto.gramsPerKgFat,
  })
}

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

  return data.map(toDomain)
}

async function insertMacroProfile(
  newMacroProfile: NewMacroProfile,
): Promise<MacroProfile | null> {
  const createDTO = toInsertDTO(newMacroProfile)
  const { data, error } = await supabase
    .from(SUPABASE_TABLE_MACRO_PROFILES)
    .insert(createDTO)
    .select()
    .single()

  if (error !== null) {
    logging.error('MacroProfile fetch error:', error)
    throw error
  }

  return toDomain(data)
}

async function updateMacroProfile(
  profileId: MacroProfile['id'],
  newMacroProfile: NewMacroProfile,
): Promise<MacroProfile | null> {
  const updateDTO = toInsertDTO(newMacroProfile)
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

  return toDomain(data)
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
