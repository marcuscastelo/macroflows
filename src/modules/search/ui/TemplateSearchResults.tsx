import { type Accessor, For, Show } from 'solid-js'

import { useContainer } from '~/di/container'
import { type Template } from '~/modules/diet/template/domain/template'
import { SearchLoadingIndicator } from '~/modules/search/ui/SearchLoadingIndicator'
import { TemplateSearchResultItem } from '~/modules/search/ui/TemplateSearchResultItem'
import { Alert } from '~/sections/common/components/Alert'

export function TemplateSearchResults(props: {
  search: string
  filteredTemplates: Accessor<readonly Template[]>
  onTemplateSelected: (template: Template) => void
  refetch: (info?: unknown) => unknown
}) {
  const templateSearchState = useContainer().templateSearchState()

  const notFoundAlert = () => {
    if (props.filteredTemplates().length > 0) {
      return null
    }

    if (
      templateSearchState.debouncedTab() === 'recent' &&
      props.search === ''
    ) {
      return 'Sem alimentos recentes. Eles aparecerão aqui assim que você adicionar seu primeiro alimento'
    }

    if (
      templateSearchState.debouncedTab() === 'favorites' &&
      props.search === ''
    ) {
      return 'Sem favoritos. Adicione alimentos ou receitas aos favoritos para vê-los aqui.'
    }

    return `Nenhum alimento encontrado para a busca "${props.search}".`
  }

  return (
    <>
      <Show
        when={!templateSearchState.templates.loading}
        fallback={
          <SearchLoadingIndicator
            message="Buscando alimentos..."
            size="medium"
            class="mt-4"
          />
        }
      >
        <Show when={notFoundAlert()}>
          <Alert color="yellow" class="mt-2">
            {notFoundAlert()}
          </Alert>
        </Show>

        <div class="flex-1 min-h-0 max-h-[60vh] overflow-y-auto scrollbar-gutter-outside scrollbar-clean bg-gray-800 mt-1 pr-4">
          <For each={props.filteredTemplates()}>
            {(template) => (
              <TemplateSearchResultItem
                template={template}
                onTemplateSelected={props.onTemplateSelected}
                refetch={props.refetch}
              />
            )}
          </For>
        </div>
      </Show>
    </>
  )
}
