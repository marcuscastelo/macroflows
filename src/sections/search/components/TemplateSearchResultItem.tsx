import { RemoveFromRecentButton } from '~/modules/diet/recent-food/ui/RemoveFromRecentButton'
import { deleteRecipe } from '~/modules/diet/recipe/application/usecases/recipeCrud'
import { getRecipePreparedQuantity } from '~/modules/diet/recipe/domain/recipeOperations'
import { templateToItem } from '~/modules/diet/template/application/templateToItem'
import {
  isTemplateFood,
  isTemplateRecipe,
  type Template,
} from '~/modules/diet/template/domain/template'
import { ItemView } from '~/sections/item/components/ItemView'
import { ItemFavorite } from '~/sections/item/components/UnifiedItemFavorite'
import { openDeleteConfirmModal } from '~/shared/modal/ui/DeleteConfirmModal'
import { logging } from '~/shared/utils/logging'

export function TemplateSearchResultItem(props: {
  template: Template
  onTemplateSelected: (template: Template) => void
  refetch: (info?: unknown) => unknown
}) {
  const displayQuantity = () => {
    if (isTemplateFood(props.template)) {
      return 100 // 100 grams for food templates
    } else {
      // For recipes, sum up the quantities of all ingredients
      const recipe = props.template
      const preparedQuantity = getRecipePreparedQuantity(recipe)
      logging.debug('recipe.preparedQuantity', { preparedQuantity })
      return preparedQuantity
    }
  }

  return (
    <ItemView
      mode="read-only"
      item={() => templateToItem(props.template, displayQuantity())}
      class="mt-1"
      handlers={{
        onClick: () => {
          props.onTemplateSelected(props.template)
        },
        onDelete: isTemplateRecipe(props.template)
          ? () => {
              openDeleteConfirmModal({
                itemName: props.template.name,
                itemType: 'receita',
                onConfirm: () => {
                  const refetch = props.refetch
                  void deleteRecipe(props.template.id).then(() => {
                    refetch()
                  })
                },
              })
            }
          : undefined,
      }}
      primaryActions={<ItemFavorite foodId={props.template.id} />}
      secondaryActions={
        <RemoveFromRecentButton
          template={props.template}
          refetch={props.refetch}
        />
      }
    />
  )
}
