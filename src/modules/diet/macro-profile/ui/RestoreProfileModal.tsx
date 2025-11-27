/**
 * Restore profile modal component and helper.
 * Provides UI for restoring a previous macro profile.
 */

import { deleteMacroProfile } from '~/modules/diet/macro-profile/application/usecases/macroProfileCrud'
import { type MacroProfile } from '~/modules/diet/macro-profile/domain/macroProfile'
import {
  showError,
  showSuccess,
} from '~/modules/toast/application/toastManager'
import { weightUseCases } from '~/modules/weight/application/weight/weightUseCases'
import { MacroTarget } from '~/sections/macro-nutrients/components/MacroTargets'
import {
  closeModal,
  openContentModal,
} from '~/shared/modal/helpers/modalHelpers'
import type { ModalId } from '~/shared/modal/types/modalTypes'
import { dateToYYYYMMDD } from '~/shared/utils/date/dateUtils'

/**
 * Controller for managing a modal's lifecycle.
 */
export type ModalController = {
  modalId: ModalId
  close: () => void
}

/**
 * Configuration for restore profile modals.
 */
export type RestoreProfileModalConfig = {
  currentProfile: MacroProfile
  previousMacroProfile: MacroProfile
  onCancel?: () => void
}

function RestoreProfileModalContent(props: {
  previousMacroProfile: MacroProfile
}) {
  const previousProfileWeight = () =>
    weightUseCases.effectiveAt(props.previousMacroProfile.target_day)?.weight ??
    weightUseCases.latest()?.weight ??
    0

  return (
    <>
      <div class="text-red-500 text-center mb-5 text-xl">
        Restaurar perfil antigo
      </div>
      <MacroTarget
        currentProfile={() => props.previousMacroProfile}
        previousMacroProfile={() => null}
        mode="view"
        weight={previousProfileWeight}
      />
      <div class="mb-4">
        {`Tem certeza que deseja restaurar o perfil de ${dateToYYYYMMDD(
          props.previousMacroProfile.target_day,
        )}?`}
      </div>
      <div class="text-red-500 text-center text-lg font-bold mb-6">
        ---- Os dados atuais serão perdidos. ----
      </div>
    </>
  )
}

function RestoreProfileModalFooter(props: {
  currentProfile: MacroProfile
  onCancel?: () => void
  onClose: () => void
}) {
  const handleRestore = () => {
    const closeModal = props.onClose
    const profileId = props.currentProfile.id
    deleteMacroProfile(profileId)
      .then(() => {
        showSuccess(
          'Perfil antigo restaurado com sucesso, se necessário, atualize a página',
        )
        closeModal()
      })
      .catch((e) => {
        showError(e, undefined, 'Erro ao restaurar perfil antigo')
      })
  }

  return (
    <div class="flex gap-2 justify-end">
      <button
        type="button"
        class="btn btn-ghost"
        onClick={() => {
          props.onCancel?.()
          props.onClose()
        }}
      >
        Cancelar
      </button>
      <button type="button" class="btn btn-primary" onClick={handleRestore}>
        Apagar atual e restaurar antigo
      </button>
    </div>
  )
}

/**
 * Opens a restore profile modal.
 */
export function openRestoreProfileModal(
  config: RestoreProfileModalConfig,
): ModalController {
  const title = 'Restaurar perfil antigo'

  let controller: ModalController

  const modalId = openContentModal(
    () => (
      <RestoreProfileModalContent
        previousMacroProfile={config.previousMacroProfile}
      />
    ),
    {
      title,
      footer: () => (
        <RestoreProfileModalFooter
          currentProfile={config.currentProfile}
          onCancel={config.onCancel}
          onClose={() => controller.close()}
        />
      ),
      onClose: () => {
        config.onCancel?.()
      },
    },
  )

  controller = {
    modalId,
    close: () => closeModal(modalId),
  }

  return controller
}
