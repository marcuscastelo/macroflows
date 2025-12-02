import { type Accessor, For, type Setter } from 'solid-js'

import { cn } from '~/shared/cn'
import { type ObjectValues } from '~/shared/utils/typeUtils'

type TabDefinition = {
  id: string
  title: string
}

export const availableTabs = {
  Todos: {
    id: 'all',
    title: 'Todos',
  } as const satisfies TabDefinition,
  Favoritos: {
    id: 'favorites',
    title: 'Favoritos',
  } as const satisfies TabDefinition,
  Recentes: {
    id: 'recent',
    title: 'Recentes',
  } as const satisfies TabDefinition,
  Receitas: {
    id: 'recipes',
    title: 'Receitas',
  } as const satisfies TabDefinition,
} as const

export type TemplateSearchTab =
  | ObjectValues<typeof availableTabs>['id']
  | 'hidden'

export function TemplateSearchTabs(props: {
  tab: Accessor<TemplateSearchTab>
  setTab: Setter<TemplateSearchTab>
}) {
  const tabKeys = Object.keys(availableTabs)

  return (
    <ul class="flex text-font-medium text-center text-gray-500 divide-x divide-gray-600 rounded-lg shadow dark:divide-gray-600 dark:text-gray-300 bg-gray-900 dark:bg-gray-900">
      <For each={tabKeys}>
        {(tabKey, i) => {
          const tabId = () =>
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            availableTabs[tabKey as keyof typeof availableTabs].id
          const tabTitle = () =>
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            availableTabs[tabKey as keyof typeof availableTabs].title
          const isActive = () => props.tab() === tabId()

          return (
            <li class="w-full">
              <a
                href="#"
                class={cn(
                  'flex min-h-full items-center justify-center px-4 py-2 text-sm font-medium first:ml-0 disabled:cursor-not-allowed disabled:text-gray-400 disabled:dark:text-gray-500 focus:outline-hidden hover:scale-110 transition-transform bg-gray-900 dark:bg-gray-900 gap-2',
                  {
                    'text-white bg-blue-700 dark:bg-blue-800 border-b-4 border-blue-400':
                      isActive(),
                    'rounded-tl-lg': i() === 0,
                    'rounded-tr-lg': i() === tabKeys.length - 1,
                  },
                )}
                aria-current={isActive() ? 'page' : undefined}
                onClick={() => {
                  props.setTab(tabId())
                }}
              >
                {tabTitle()}
              </a>
            </li>
          )
        }}
      </For>
    </ul>
  )
}
