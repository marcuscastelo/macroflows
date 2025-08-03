import { For, Show } from 'solid-js'

import { deleteRecipe } from '~/modules/diet/recipe/application/usecases/recipeCrud'
import { getRecipePreparedQuantity } from '~/modules/diet/recipe/domain/recipeOperations'
import { templateToUnifiedItem } from '~/modules/diet/template/application/templateToItem'
import {
  isTemplateFood,
  isTemplateRecipe,
  type Template,
} from '~/modules/diet/template/domain/template'
import { debouncedTab, templates } from '~/modules/search/application/search'
import { Alert } from '~/sections/common/components/Alert'
import { RemoveFromRecentButton } from '~/sections/common/components/buttons/RemoveFromRecentButton'
import { SearchLoadingIndicator } from '~/sections/search/components/SearchLoadingIndicator'
import { UnifiedItemFavorite } from '~/sections/unified-item/components/UnifiedItemFavorite'
import { UnifiedItemView } from '~/sections/unified-item/components/UnifiedItemView'
import { openDeleteConfirmModal } from '~/shared/modal/helpers/specializedModalHelpers'
import { createDebug } from '~/shared/utils/createDebug'

const debug = createDebug()

export function TemplateSearchResults(props: {
  search: string
  filteredTemplates: readonly Template[]
  onTemplateSelected: (template: Template) => void
  refetch: (info?: unknown) => unknown
}) {
  return (
    <>
      <Show
        when={!templates.loading}
        fallback={
          <SearchLoadingIndicator
            message="Buscando alimentos..."
            size="medium"
            class="mt-4"
          />
        }
      >
        <Show when={props.filteredTemplates.length === 0}>
          <Alert color="yellow" class="mt-2">
            {debouncedTab() === 'recent' && props.search === ''
              ? 'Sem alimentos recentes. Eles aparecerão aqui assim que você adicionar seu primeiro alimento'
              : debouncedTab() === 'favorites' && props.search === ''
                ? 'Sem favoritos. Adicione alimentos ou receitas aos favoritos para vê-los aqui.'
                : `Nenhum alimento encontrado para a busca "${props.search}".`}
          </Alert>
        </Show>

        <div class="flex-1 min-h-0 max-h-[60vh] overflow-y-auto scrollbar-gutter-outside scrollbar-clean bg-gray-800 mt-1 pr-4">
          <For each={props.filteredTemplates}>
            {(template) => {
              // Calculate appropriate display quantity for each template
              const getDisplayQuantity = () => {
                if (isTemplateFood(template)) {
                  return 100 // Standard 100g for foods
                } else {
                  // For recipes, show the prepared quantity rounded to nearest RECIPE_ROUNDING_FACTOR
                  const recipe = template
                  debug('recipe', recipe)
                  const preparedQuantity = getRecipePreparedQuantity(recipe)
                  debug('recipe.preparedQuantity', preparedQuantity)
                  return preparedQuantity
                }
              }

              const displayQuantity = getDisplayQuantity()

              // Convert template to UnifiedItem using shared utility
              const createUnifiedItemFromTemplate = () => {
                const result = templateToUnifiedItem(template, displayQuantity)
                debug('createUnifiedItemFromTemplate', result)
                return result
              }

              return (
                <>
                  <UnifiedItemView
                    mode="read-only"
                    item={createUnifiedItemFromTemplate}
                    class="mt-1"
                    handlers={{
                      onClick: () => {
                        props.onTemplateSelected(template)
                      },
                      onDelete: isTemplateRecipe(template)
                        ? () => {
                            openDeleteConfirmModal({
                              itemName: template.name,
                              itemType: 'receita',
                              onConfirm: () => {
                                const refetch = props.refetch
                                void deleteRecipe(template.id).then(() => {
                                  refetch()
                                })
                              },
                            })
                          }
                        : undefined,
                    }}
                    primaryActions={
                      <UnifiedItemFavorite foodId={template.id} />
                    }
                    secondaryActions={
                      <RemoveFromRecentButton
                        template={template}
                        refetch={props.refetch}
                      />
                    }
                  />
                </>
              )
            }}
          </For>
        </div>
      </Show>
    </>
  )
}
