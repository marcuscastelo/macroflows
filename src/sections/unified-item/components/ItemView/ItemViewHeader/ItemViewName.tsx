import { type Accessor, createMemo, createResource, Show } from 'solid-js'

import { fetchRecipeById } from '~/modules/diet/recipe/application/usecases/recipeCrud'
import { ItemExt } from '~/modules/diet/unified-item/domain/itemExt'
import {
  isRecipeItem,
  type UnifiedItem,
} from '~/modules/diet/unified-item/schema/unifiedItemSchema'
import { getItemTypeDisplay } from '~/sections/unified-item/utils/unifiedItemDisplayUtils'
import { logging } from '~/shared/utils/logging'

export type ItemViewNameProps = {
  item: Accessor<UnifiedItem>
}

export function ItemViewName(props: ItemViewNameProps) {
  const typeDisplay = () => getItemTypeDisplay(props.item())

  const [originalRecipe] = createResource(
    () => {
      const item = props.item()
      return isRecipeItem(item) ? item.reference.id : null
    },
    async (recipeId: number) => {
      try {
        return await fetchRecipeById(recipeId)
      } catch (error) {
        logging.warn('Failed to fetch recipe for comparison:', { error })
        return null
      }
    },
  )

  const isManuallyEdited = createMemo(() => {
    const item = props.item()
    const recipe = originalRecipe()

    if (recipe === null || recipe === undefined || originalRecipe.loading) {
      return false
    }

    // Compare original recipe items with current recipe items
    // If they're different, the recipe was manually edited
    return !ItemExt.of(item).isInSyncWithRecipe(recipe.items)
  })

  const warningIndicator = () => (isManuallyEdited() ? '⚠️' : '')

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
