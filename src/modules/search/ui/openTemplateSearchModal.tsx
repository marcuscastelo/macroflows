import {
  TemplateSearchModal,
  type TemplateSearchModalProps,
} from '~/modules/search/ui/TemplateSearchModal'
import {
  closeModal,
  openContentModal,
} from '~/shared/modal/helpers/modalHelpers'

/**
 * Configuration for template search modals.
 */
export type TemplateSearchModalConfig = TemplateSearchModalProps & {
  title?: string
}

/**
 * Opens a template search modal.
 */
export function openTemplateSearchModal(config: TemplateSearchModalConfig) {
  const title = config.title ?? `Adicionar item - ${config.targetName}`

  const modalId = openContentModal(
    () => (
      <TemplateSearchModal
        targetName={config.targetName}
        onNewItem={config.onNewItem}
        onFinish={() => {
          config.onFinish?.()
          closeModal(modalId)
        }}
        onClose={() => {
          config.onClose?.()
          closeModal(modalId)
        }}
      />
    ),
    {
      title,
      onClose: () => {
        config.onClose?.()
      },
    },
  )

  return modalId
}
