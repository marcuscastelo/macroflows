import { signOut } from '~/modules/auth/application/services/authService'
import { showPromise } from '~/modules/toast/application/toastManager'
import { resetGuestDatabase } from '~/shared/guest/guestDatabase'
import { openConfirmModal } from '~/shared/modal/helpers/modalHelpers'
import { jsonParseWithStack } from '~/shared/utils/jsonParseWithStack'
import { logging } from '~/shared/utils/logging'

const GUEST_TERMS_KEY = 'guest-terms-accepted'
type GuestTermValue = {
  acceptedAt: string
}

export const guestUseCases = {
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
          showPromise(signOut(), {
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
}
