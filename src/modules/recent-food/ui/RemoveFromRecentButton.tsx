import { Show } from 'solid-js'

import { authUseCases } from '~/modules/auth/application/usecases/authUseCases'
import {
  isTemplateFood,
  type Template,
} from '~/modules/diet/template/domain/template'
import { recentFoodUseCases } from '~/modules/recent-food/application/usecases/recentFoodUseCases'
import { debouncedTab } from '~/modules/template-search/application/usecases/templateSearchState'
import { TrashIcon } from '~/sections/common/components/icons/TrashIcon'

type RemoveFromRecentButtonProps = {
  template: Template
  refetch: (info?: unknown) => unknown
}

export function RemoveFromRecentButton(props: RemoveFromRecentButtonProps) {
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    const templateType = isTemplateFood(props.template) ? 'food' : 'recipe'
    const templateId = props.template.id

    const userId = authUseCases.currentUserIdOrGuestId()

    void recentFoodUseCases
      .deleteRecentFoodByReference(userId, templateType, templateId)
      .then(props.refetch)
  }

  return (
    <Show when={debouncedTab() === 'recent'}>
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
