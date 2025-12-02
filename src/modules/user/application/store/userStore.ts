import { createEffect, createSignal } from 'solid-js'

import { authUseCases } from '~/modules/auth/application/usecases/authUseCases'
import { showPromise } from '~/modules/toast/application/toastManager'
import { userUseCases } from '~/modules/user/application/usecases/userUseCases'
import { type User } from '~/modules/user/domain/user'
import { GUEST_USER_ID } from '~/shared/guest/guestConstants'
import { logging } from '~/shared/utils/logging'

export function createUserStore() {
  const [currentUser, setCurrentUser] = createSignal<User | null>(null)
  const currentUserId = () => authUseCases.getCurrentUser()?.id ?? GUEST_USER_ID

  createEffect(() => {
    const update = async () => {
      setCurrentUser(
        await showPromise(
          userUseCases.fetchUser(currentUserId()),
          {
            loading: 'Carregando usuário atual...',
            success: 'Usuário atual carregado com sucesso',
            error: 'Falha ao carregar usuário atual',
          },
          { context: 'background' },
        ),
      )
    }

    update().catch((error) => {
      logging.error('User application error:', error)
    })
  })

  return { currentUserId, currentUser, setCurrentUser }
}
