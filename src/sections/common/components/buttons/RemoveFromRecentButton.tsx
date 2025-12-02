import { Show } from 'solid-js'

import {
  isTemplateFood,
  type Template,
} from '~/modules/diet/template/domain/template'
import { deleteRecentFoodByReference } from '~/modules/recent-food/application/usecases/recentFoodCrud'
import { debouncedTab } from '~/modules/template-search/application/usecases/templateSearchState'
import { showPromise } from '~/modules/toast/application/toastManager'
import { userUseCases } from '~/modules/user/application/usecases/userUseCases'
import { TrashIcon } from '~/sections/common/components/icons/TrashIcon'
import { logging } from '~/shared/utils/logging'

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

    const userId = userUseCases.currentUserId_unsafe()

    void showPromise(
      deleteRecentFoodByReference(userId, templateType, templateId),
      {
        loading: 'Removendo item da lista de recentes...',
        success: 'Item removido da lista de recentes com sucesso!',
        error: (err: unknown) => {
          logging.error('RemoveFromRecentButton error:', err)
          return 'Erro ao remover item da lista de recentes.'
        },
      },
    )
      .then(props.refetch)
      .catch(() => {})
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
