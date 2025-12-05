import { Show } from 'solid-js'

import { recentFoodUseCases } from '~/modules/diet/recent-food/application/usecases/recentFoodUseCases'
import { type Template } from '~/modules/diet/template/domain/template'
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

    void recentFoodUseCases
      .deleteRecentFoodOfTemplate(props.template)
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
