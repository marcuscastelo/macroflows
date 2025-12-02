import { type AuthSession } from '~/modules/auth/domain/auth'
import { createNewUser, type NewUser } from '~/modules/user/domain/user'

/**
 * Creates a default new user from an auth session.
 * @param session - The auth session containing user data.
 * @returns A NewUser object with default values.
 */
export function generateDefaultUserFromSession(session: AuthSession): NewUser {
  const authUser = session.user
  const metadata = authUser.user_metadata ?? {}
  const fullName = metadata['full_name']
  const name = metadata['name']
  const emailPrefix = authUser.email.split('@')[0]
  const displayName =
    (typeof fullName === 'string' ? fullName : null) ??
    (typeof name === 'string' ? name : null) ??
    (emailPrefix !== '' ? emailPrefix : null) ??
    'User'

  return createNewUser({
    uuid: authUser.id,
    name: displayName,
    favorite_foods: [],
    diet: 'normo',
    birthdate: new Date().toISOString().split('T')[0] ?? '',
    gender: 'male',
    desired_weight: 70,
  })
}
