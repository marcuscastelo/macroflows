import { createRoot } from 'solid-js'

import { authUseCases } from '~/modules/auth/application/usecases/authUseCases'
import { showPromise } from '~/modules/toast/application/toastManager'
import { GUEST_USER_ID } from '~/shared/guest/guestConstants'
import { resetGuestDatabase } from '~/shared/guest/guestDatabase'
import { openConfirmModal } from '~/shared/modal/helpers/modalHelpers'
import { jsonParseWithStack } from '~/shared/utils/jsonParseWithStack'
import { logging } from '~/shared/utils/logging'

const GUEST_TERMS_KEY = 'guest-terms-accepted'
type GuestTermValue = {
  acceptedAt: string
}

const { guestStore } = createRoot(() => {
  const guestStore = createGuestStore()
  return { guestStore }
})

export const guestUseCases = {
  isGuestMode: () =>
    authUseCases.currentUserIdOrGuestId() === GUEST_USER_ID &&
    guestUseCases.hasAcceptedGuestTerms(),
  hasAcceptedGuestTerms: () => {
    const item = localStorage.getItem(GUEST_TERMS_KEY)
    const accepted = item !== null ? jsonParseWithStack(item) : false
    if (typeof accepted === 'boolean') {
      return accepted
    }
    if (
      typeof accepted === 'object' &&
      accepted !== null &&
      'acceptedAt' in accepted
    ) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const value = accepted as GuestTermValue
      if (typeof value.acceptedAt !== 'string') {
        return false
      }
      // 1d = 86400000 ms
      const oneDayAgo = new Date(Date.now() - 86400000)
      return new Date(value.acceptedAt) > oneDayAgo
    }
    return false
  },

  acceptGuestTerms: () => {
    localStorage.setItem(
      GUEST_TERMS_KEY,
      JSON.stringify({ acceptedAt: new Date().toISOString() }),
    )
  },

  revokeGuestTerms: () => {
    localStorage.removeItem(GUEST_TERMS_KEY)
  },

  enterGuestMode: (onSuccess: () => void) => {
    if (guestUseCases.hasAcceptedGuestTerms()) {
      resetGuestDatabase()
      onSuccess()
      return
    }

    openConfirmModal(
      'Ao entrar em modo convidado, seus dados não serão salvos permanentemente e poderão ser perdidos. Deseja continuar?',
      {
        title: 'Entrar em modo convidado',
        confirmText: 'Sim, entrar em modo convidado',
        cancelText: 'Cancelar',
        onConfirm: () => {
          guestUseCases.acceptGuestTerms()
          showPromise(authUseCases.signOut(), {
            loading: 'Entrando em modo convidado...',
            success: 'Agora você está em modo convidado!',
            error: 'Erro ao entrar em modo convidado. Tente novamente.',
          })
            .then(() => {
              resetGuestDatabase()
              onSuccess()
            })
            .catch((error) => {
              logging.error('Guest mode error:', error)
            })
        },
      },
    )
  },

  exitGuestMode: (onSuccess: () => void) => {
    showPromise(authUseCases.signOut(), {
      loading: 'Saindo do modo convidado...',
      success: 'Modo convidado desativado!',
      error: 'Erro ao sair do modo convidado. Tente novamente.',
    })
      .then(() => {
        guestUseCases.revokeGuestTerms()
        onSuccess()
      })
      .catch((error) => {
        logging.error('Exit guest mode error:', error)
      })
  },
}
