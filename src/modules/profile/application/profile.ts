import { createEffect, createSignal } from 'solid-js'

import { userUseCases } from '~/modules/user/application/usecases/userUseCases'
import { type User } from '~/modules/user/domain/user'
import { type Mutable } from '~/shared/utils/typeUtils'

export type UnsavedFields = { [key in keyof Mutable<User>]?: boolean }
export const [unsavedFields, setUnsavedFields] = createSignal<UnsavedFields>({})
export const [innerData, setInnerData] = createSignal<User | null>(
  userUseCases.currentUser(),
)

// Sync innerData with currentUser when it changes
createEffect(() => {
  setInnerData(userUseCases.currentUser())
})
