import { createSignal } from 'solid-js'

import { type MacroProfile } from '~/modules/diet/macro-profile/domain/macroProfile'
import { type User } from '~/modules/user/domain/user'

type CacheKey =
  | { by: 'id'; value: MacroProfile['id'] }
  | { by: 'user_id'; value: User['id'] }

const [cachedProfiles, setCachedProfiles] = createSignal<
  readonly MacroProfile[]
>([])

export const macroProfileCacheStore = {
  getCache: () => cachedProfiles(),

  upsertToCache: (profile: MacroProfile) => {
    setCachedProfiles((current) => {
      const index = current.findIndex((p) => p.id === profile.id)
      if (index >= 0) {
        // Update existing
        const newProfiles = [...current]
        newProfiles[index] = profile
        return newProfiles
      } else {
        // Add new
        return [...current, profile]
      }
    })
  },

  upsertManyToCache: (profiles: readonly MacroProfile[]) => {
    setCachedProfiles((current) => {
      const updatedProfiles = [...current]

      for (const profile of profiles) {
        const index = updatedProfiles.findIndex((p) => p.id === profile.id)
        if (index >= 0) {
          updatedProfiles[index] = profile
        } else {
          updatedProfiles.push(profile)
        }
      }

      return updatedProfiles
    })
  },

  removeFromCache: (key: CacheKey) => {
    setCachedProfiles((current) => {
      switch (key.by) {
        case 'id':
          return current.filter((p) => p.id !== key.value)
        case 'user_id':
          return current.filter((p) => p.owner !== key.value)
        default:
          return current
      }
    })
  },

  clearCache: () => setCachedProfiles([]),

  getProfilesByUserId: (userId: User['id']) => {
    return cachedProfiles().filter((p) => p.owner === userId)
  },

  getProfileById: (id: MacroProfile['id']) => {
    return cachedProfiles().find((p) => p.id === id) ?? null
  },
}
