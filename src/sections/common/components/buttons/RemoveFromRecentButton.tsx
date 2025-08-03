import { Show } from 'solid-js'

import {
  isTemplateFood,
  type Template,
} from '~/modules/diet/template/domain/template'
import { deleteRecentFoodByReference } from '~/modules/recent-food/application/usecases/recentFoodCrud'
import { debouncedTab } from '~/modules/search/application/search'
import { showPromise } from '~/modules/toast/application/toastManager'
import { currentUserId } from '~/modules/user/application/user'
import { TrashIcon } from '~/sections/common/components/icons/TrashIcon'
import { createErrorHandler } from '~/shared/error/errorHandler'

type RemoveFromRecentButtonProps = {
  template: Template
  refetch: (info?: unknown) => unknown
}

const errorHandler = createErrorHandler('user', 'RemoveFromRecentButton')

export function RemoveFromRecentButton(props: RemoveFromRecentButtonProps) {
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    const templateType = isTemplateFood(props.template) ? 'food' : 'recipe'
    const templateId = props.template.id

    void showPromise(
      deleteRecentFoodByReference(currentUserId(), templateType, templateId),
      {
        loading: 'Removendo item da lista de recentes...',
        success: 'Item removido da lista de recentes com sucesso!',
        error: (err: unknown) => {
          errorHandler.error(err, { operation: 'userAction' })
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
