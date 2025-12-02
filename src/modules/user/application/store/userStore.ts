import { createSignal } from 'solid-js'

import { type User } from '~/modules/user/domain/user'

export function createUserStore() {
  const [currentUser, setCurrentUser] = createSignal<User | null>(null)

  return { currentUser, setCurrentUser }
}
