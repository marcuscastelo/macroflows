import { Show } from 'solid-js'

import { useContainer } from '~/di/container'
import {
  isTemplateFood,
  type Template,
} from '~/modules/diet/template/domain/template'
import { TrashIcon } from '~/sections/common/components/icons/TrashIcon'
import { logging } from '~/shared/utils/logging'

type RemoveFromRecentButtonProps = {
  template: Template
  refetch: (info?: unknown) => unknown
}

export function RemoveFromRecentButton(props: RemoveFromRecentButtonProps) {
  const useCases = useContainer()
  const authUseCases = useCases.authUseCases()
  const recentFoodUseCases = useCases.recentFoodUseCases()
  const templateSearchState = useCases.templateSearchState()

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    const templateType = isTemplateFood(props.template) ? 'food' : 'recipe'
    const templateId = props.template.id
    const userId = authUseCases.currentUserIdOrGuestId()

    void recentFoodUseCases
      .deleteRecentFoodByReference(userId, templateType, templateId)
      .then(props.refetch)
      .catch((err) => {
        logging.error('RemoveFromRecentButton error:', err)
      })
  }

  return (
    <Show when={templateSearchState.debouncedTab() === 'recent'}>
      <button
        class="my-auto pt-2 pl-1 hover:animate-pulse"
        onClick={handleClick}
        aria-label="Remover dos recentes"
        type="button"
      >
        <TrashIcon size={20} />
      </button>
    </Show>
  )
}
