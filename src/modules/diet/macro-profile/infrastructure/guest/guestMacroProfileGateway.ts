import {
  type MacroProfile,
  type NewMacroProfile,
  promoteToMacroProfile,
} from '~/modules/diet/macro-profile/domain/macroProfile'
import { type MacroProfileGateway } from '~/modules/diet/macro-profile/domain/macroProfileGateway'
import { type User } from '~/modules/user/domain/user'
import {
  getGuestDatabase,
  updateGuestDatabase,
} from '~/shared/guest/guestDatabase'
import { logging } from '~/shared/utils/logging'

let nextMacroProfileId = 10000

function generateMacroProfileId(): number {
  return nextMacroProfileId++
}

/**
 * Creates a guest macro profile gateway that uses the in-memory guest database
 */
export function createGuestMacroProfileGateway(): MacroProfileGateway {
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
  const db = getGuestDatabase()
  const profiles = db.macroProfiles.filter((p) => p.user_id === userId)
  logging.debug('[guestMacroProfileGateway] fetchUserMacroProfiles', {
    userId,
    count: profiles.length,
  })
  return profiles
}

async function insertMacroProfile(
  newMacroProfile: NewMacroProfile,
): Promise<MacroProfile | null> {
  const macroProfile = promoteToMacroProfile(newMacroProfile, {
    id: generateMacroProfileId(),
  })

  updateGuestDatabase((db) => ({
    ...db,
    macroProfiles: [...db.macroProfiles, macroProfile],
  }))

  logging.debug('[guestMacroProfileGateway] insertMacroProfile', {
    macroProfile,
  })
  return macroProfile
}

async function updateMacroProfile(
  macroProfileId: MacroProfile['id'],
  newMacroProfile: NewMacroProfile,
): Promise<MacroProfile | null> {
  let updatedMacroProfile: MacroProfile | null = null

  updateGuestDatabase((db) => ({
    ...db,
    macroProfiles: db.macroProfiles.map((p) => {
      if (p.id === macroProfileId) {
        updatedMacroProfile = {
          ...newMacroProfile,
          id: macroProfileId,
          __type: 'MacroProfile',
        }
        return updatedMacroProfile
      }
      return p
    }),
  }))

  logging.debug('[guestMacroProfileGateway] updateMacroProfile', {
    macroProfileId,
    updatedMacroProfile,
  })
  return updatedMacroProfile
}

async function deleteMacroProfile(id: MacroProfile['id']): Promise<void> {
  updateGuestDatabase((db) => ({
    ...db,
    macroProfiles: db.macroProfiles.filter((p) => p.id !== id),
  }))

  logging.debug('[guestMacroProfileGateway] deleteMacroProfile', { id })
}
