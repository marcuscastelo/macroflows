import { createSignal } from 'solid-js'

import { type User } from '~/modules/user/domain/user'

const [selectedUserId, setSelectedUserId] = createSignal<User['uuid'] | null>(
  null,
)

export const macroProfileStateStore = {
  selectedUserId,
  setSelectedUserId,
}
