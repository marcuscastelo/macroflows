import { type Accessor, Show } from 'solid-js'

import { recipeItemUseCases } from '~/modules/diet/item/application/recipeItemUseCases'
import { type Item } from '~/modules/diet/item/schema/itemSchema'
import { getItemTypeDisplay } from '~/sections/item/utils/unifiedItemDisplayUtils'

export type ItemViewNameProps = {
  item: Accessor<Item>
}

export function ItemViewName(props: ItemViewNameProps) {
  const typeDisplay = () => getItemTypeDisplay(props.item())

  const recipeResource = recipeItemUseCases.createRecipeResource(() =>
    props.item(),
  )

  const warningIndicator = () =>
    recipeItemUseCases.isManuallyEdited(props.item(), recipeResource.value)
      ? '⚠️'
      : ''

  return (
    <h5 class={`mb-2 text-lg font-bold tracking-tight ${typeDisplay().color}`}>
      <span class="mr-2 cursor-help" title={typeDisplay().label}>
        {typeDisplay().icon}
      </span>
      {props.item().name}
      <Show when={warningIndicator()}>
        <span class="ml-1 text-yellow-500" title="Receita editada pontualmente">
          {warningIndicator()}
        </span>
      </Show>
    </h5>
  )
}
