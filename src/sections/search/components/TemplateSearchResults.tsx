import { For, Show } from 'solid-js'

import { type Template } from '~/modules/diet/template/domain/template'
import {
  debouncedTab,
  templates,
} from '~/modules/template-search/application/usecases/templateSearchState'
import { Alert } from '~/sections/common/components/Alert'
import { SearchLoadingIndicator } from '~/sections/search/components/SearchLoadingIndicator'
import { TemplateSearchResultItem } from '~/sections/search/components/TemplateSearchResultItem'

export function TemplateSearchResults(props: {
  search: string
  filteredTemplates: readonly Template[]
  onTemplateSelected: (template: Template) => void
  refetch: (info?: unknown) => unknown
}) {
  const notFoundAlert = () => {
    if (props.filteredTemplates.length > 0) {
      return null
    }

    if (debouncedTab() === 'recent' && props.search === '') {
      return 'Sem alimentos recentes. Eles aparecerão aqui assim que você adicionar seu primeiro alimento'
    }

    if (debouncedTab() === 'favorites' && props.search === '') {
      return 'Sem favoritos. Adicione alimentos ou receitas aos favoritos para vê-los aqui.'
    }

    return `Nenhum alimento encontrado para a busca "${props.search}".`
  }

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
        <Show when={notFoundAlert()}>
          <Alert color="yellow" class="mt-2">
            {notFoundAlert()}
          </Alert>
        </Show>

        <div class="flex-1 min-h-0 max-h-[60vh] overflow-y-auto scrollbar-gutter-outside scrollbar-clean bg-gray-800 mt-1 pr-4">
          <For each={props.filteredTemplates}>
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
