import { showPromise } from '~/modules/toast/application/toastManager'
import { resetGuestDatabase } from '~/shared/guest/guestDatabase'
import { createGuestDI, type GuestDI } from '~/shared/guest/guestDI'
import { openConfirmModal } from '~/shared/modal/helpers/modalHelpers'
import { jsonParseWithStack } from '~/shared/utils/jsonParseWithStack'
import { logging } from '~/shared/utils/logging'

const GUEST_TERMS_KEY = 'guest-terms-accepted'
type GuestTermValue = {
  acceptedAt: string
}

export function createGuestUseCases(di: GuestDI) {
  const { guestStore, authUseCases } = createGuestDI(di)

  function initializeGuestMode() {
    if (typeof localStorage === 'undefined') {
      guestStore.setAcceptedGuestTerms(false)
      return
    }

    const item = localStorage.getItem(GUEST_TERMS_KEY)
    const accepted = item !== null ? jsonParseWithStack(item) : false
    if (typeof accepted === 'boolean') {
      guestStore.setAcceptedGuestTerms(accepted)
      return
    }
    if (
      typeof accepted === 'object' &&
      accepted !== null &&
      'acceptedAt' in accepted
    ) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const value = accepted as GuestTermValue
      if (typeof value.acceptedAt !== 'string') {
        guestStore.setAcceptedGuestTerms(false)
        return
      }
      // 1d = 86400000 ms
      const oneDayAgo = new Date(Date.now() - 86400000)
      const isValid = new Date(value.acceptedAt) > oneDayAgo
      guestStore.setAcceptedGuestTerms(isValid)
      return
    }
    guestStore.setAcceptedGuestTerms(false)
  }

  const guestUseCases = {
    initializeGuestMode,
    isGuestMode: () =>
      guestStore.guestModeEnabled() && guestUseCases.hasAcceptedGuestTerms(),
    setGuestModeEnabled: (enabled: boolean) => {
      guestStore.setGuestModeEnabled(enabled)
    },
    hasAcceptedGuestTerms: () => {
      return guestStore.acceptedGuestTerms()
    },

    acceptGuestTerms: () => {
      localStorage.setItem(
        GUEST_TERMS_KEY,
        JSON.stringify({ acceptedAt: new Date().toISOString() }),
      )
      guestStore.setAcceptedGuestTerms(true)
    },

    revokeGuestTerms: () => {
      localStorage.removeItem(GUEST_TERMS_KEY)
      guestStore.setAcceptedGuestTerms(false)
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

  return guestUseCases
}

export type GuestUseCases = ReturnType<typeof createGuestUseCases>
